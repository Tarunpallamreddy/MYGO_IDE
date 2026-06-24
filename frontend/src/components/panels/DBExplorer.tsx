import React, { useState } from 'react';
import { Database, Play, RefreshCw, Terminal, Grid, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface DBTable {
  name: string;
  columns: string[];
}

const mockSchemas: Record<string, DBTable[]> = {
  postgres: [
    { name: 'users', columns: ['id (int)', 'username (varchar)', 'email (varchar)', 'role (varchar)', 'created_at (timestamp)'] },
    { name: 'user_settings', columns: ['id (int)', 'user_id (int)', 'theme (varchar)', 'font_size (int)', 'autosave (boolean)'] },
    { name: 'active_sessions', columns: ['id (int)', 'user_id (int)', 'token (varchar)', 'last_accessed (timestamp)'] },
  ],
  mysql: [
    { name: 'customers', columns: ['customer_id', 'first_name', 'last_name', 'email', 'phone'] },
    { name: 'orders', columns: ['order_id', 'customer_id', 'order_date', 'total_amount'] },
  ],
  redis: [
    { name: 'session:tokens (Hash)', columns: [] },
    { name: 'user:settings:cache (String)', columns: [] },
  ],
  dynamodb: [
    { name: 'MyGoWorkspaceState', columns: ['PartitionKey (S)', 'SortKey (S)', 'Metadata (M)'] },
  ]
};

const mockQueryResults: Record<string, Array<Record<string, any>>> = {
  'select * from users': [
    { id: 1, username: 'mygo-user', email: 'dev@mygo.internal', role: 'Admin', created_at: '2026-06-24 07:48' },
    { id: 2, username: 'tarun-saiteja', email: 'tarun@mygo.internal', role: 'Developer', created_at: '2026-06-24 10:15' },
    { id: 3, username: 'collaboration-bot', email: 'collab@mygo.internal', role: 'Viewer', created_at: '2026-06-24 12:30' }
  ],
  'select * from user_settings': [
    { id: 1, user_id: 1, theme: 'dark-theme', font_size: 14, autosave: 1 },
    { id: 2, user_id: 2, theme: 'light-theme', font_size: 16, autosave: 1 }
  ],
  'get user:settings:cache': [
    { key: 'user:settings:cache', value: '{"theme":"dark-theme","fontSize":14,"autosave":true}' }
  ]
};

export default function DBExplorer() {
  const [dbType, setDbType] = useState('postgres');
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [results, setResults] = useState<Array<Record<string, any>> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runQuery = () => {
    setErrorMsg(null);
    setResults(null);
    
    const cleanQuery = query.trim().toLowerCase().replace(/;/g, '');
    
    setTimeout(() => {
      if (cleanQuery in mockQueryResults) {
        setResults(mockQueryResults[cleanQuery]);
      } else {
        // Fallback or generic select mock
        if (cleanQuery.includes('select') || dbType === 'postgres' || dbType === 'mysql') {
          if (cleanQuery.includes('settings')) {
             setResults(mockQueryResults['select * from user_settings']);
          } else {
             setResults(mockQueryResults['select * from users']);
          }
        } else if (cleanQuery.includes('get') || dbType === 'redis') {
           setResults(mockQueryResults['get user:settings:cache']);
        } else {
          setErrorMsg(`Syntax Error: relation or key for command "${query}" not recognized in current schemas.`);
        }
      }
    }, 400);
  };

  const autofillQuery = (tableName: string) => {
    if (dbType === 'redis') {
      setQuery(`GET ${tableName.split(' ')[0]};`);
    } else if (dbType === 'dynamodb') {
      setQuery(`SCAN ${tableName};`);
    } else {
      setQuery(`SELECT * FROM ${tableName} LIMIT 10;`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary text-text-main overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border-color">
        <h3 className="text-xs font-bold tracking-wider text-text-muted uppercase mb-2">Database Explorer</h3>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] text-text-muted font-semibold">Engine:</span>
          <select 
            value={dbType}
            onChange={e => {
              setDbType(e.target.value);
              setResults(null);
              setErrorMsg(null);
              if (e.target.value === 'redis') setQuery('GET user:settings:cache;');
              else if (e.target.value === 'dynamodb') setQuery('SCAN MyGoWorkspaceState;');
              else setQuery('SELECT * FROM users LIMIT 10;');
            }}
            className="bg-bg-primary border border-border-color text-text-main text-[11px] rounded px-2 py-1 outline-none focus:border-border-focus"
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="redis">Redis (Cache)</option>
            <option value="dynamodb">DynamoDB (NoSQL)</option>
          </select>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Schema Tree */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database size={13} className="text-accent-cyan" />
            <span>Tables Schema</span>
          </h4>
          <div className="flex flex-col gap-1.5 bg-bg-primary border border-border-color rounded p-2 text-xs">
            {mockSchemas[dbType]?.map(tbl => (
              <div key={tbl.name} className="flex flex-col">
                <button 
                  onClick={() => {
                    setExpandedTable(expandedTable === tbl.name ? null : tbl.name);
                    autofillQuery(tbl.name);
                  }}
                  className="flex items-center justify-between text-left py-1 hover:text-accent-cyan font-mono text-[11px] w-full"
                >
                  <span className="flex items-center gap-1">
                    <ChevronRight size={12} className={`transform transition-transform ${expandedTable === tbl.name ? 'rotate-90 text-accent-cyan' : 'text-text-muted'}`} />
                    {tbl.name}
                  </span>
                </button>
                {expandedTable === tbl.name && tbl.columns.length > 0 && (
                  <div className="pl-5 border-l border-border-color/55 py-1 flex flex-col gap-0.5 text-[10px] text-text-muted font-mono">
                    {tbl.columns.map(col => <div key={col}>{col}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Query Editor */}
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal size={13} className="text-accent-violet" />
            <span>SQL / Query Terminal</span>
          </h4>
          <div className="border border-border-color rounded overflow-hidden">
            <textarea 
              value={query}
              onChange={e => setQuery(e.target.value)}
              spellCheck="false"
              className="w-full h-[80px] bg-bg-primary text-text-main font-mono text-[11px] p-2.5 resize-none outline-none focus:border-border-focus"
            />
            <div className="bg-bg-secondary p-1.5 border-t border-border-color flex justify-end">
              <button 
                onClick={runQuery}
                className="flex items-center gap-1 text-[10px] bg-accent-cyan text-bg-primary px-3 py-1 rounded font-bold hover:bg-opacity-80 transition"
              >
                <Play size={10} fill="currentColor" /> Run Query
              </button>
            </div>
          </div>
        </div>

        {/* Output Grid */}
        <div className="flex-1 flex flex-col min-h-[160px]">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Grid size={13} className="text-accent-green" />
            <span>Data Output Grid</span>
          </h4>
          
          <div className="bg-bg-primary border border-border-color rounded flex-1 overflow-auto flex flex-col relative">
            {errorMsg && (
              <div className="p-3 text-accent-red font-mono text-[10px] bg-accent-red/5 border-l-2 border-accent-red m-2 rounded">
                {errorMsg}
              </div>
            )}
            
            {results ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-[10px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-secondary border-b border-border-color">
                      {Object.keys(results[0]).map(key => (
                        <th key={key} className="p-2 border-r border-border-color text-text-muted font-bold capitalize">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx} className="border-b border-border-color/40 hover:bg-bg-secondary/30">
                        {Object.values(row).map((val, cellIdx) => (
                          <td key={cellIdx} className="p-2 border-r border-border-color/40 text-text-main truncate max-w-[120px]">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !errorMsg && (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted italic text-[10px] py-10">
                <FileSpreadsheet size={24} className="opacity-30 mb-1" />
                <span>Execute query to stream records.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
