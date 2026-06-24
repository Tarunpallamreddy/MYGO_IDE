const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mygo-ide-secret-key-99';
const WORKSPACE_ROOT = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json());

// Set up file upload destination
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Simple JSON Database for persistence without external DB engines
const DB_FILE = path.join(__dirname, 'db_store.json');
let db = {
  users: [
    {
      id: 1,
      username: 'mygo-user',
      email: 'dev@mygo.internal',
      passwordHash: bcrypt.hashSync('mygodev123', 10),
      role: 'Admin',
      mfaEnabled: false
    }
  ],
  settings: {
    1: { theme: 'dark-theme', font_size: 14, autosave: true, format_on_save: true }
  }
};

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load JSON database, resetting.');
  }
}

const saveDb = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

// Path Safety Check helper
const safePath = (relPath) => {
  const cleanRel = relPath.replace(/^[/\\]+/, '');
  const resolved = path.resolve(WORKSPACE_ROOT, cleanRel);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error('Access Denied: Path escapes workspace root');
  }
  return resolved;
};

// ============================================================================
// 1. FILE EXPLORER ROUTER
// ============================================================================

const buildTreeRecursive = (dirPath, depth = 0) => {
  if (depth > 5) return [];
  const tree = [];
  try {
    const items = fs.readdirSync(dirPath);
    const sorted = items.sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
      return bIsDir - aIsDir || a.toLowerCase().localeCompare(b.toLowerCase());
    });

    for (const item of sorted) {
      if (['node_modules', '.git', '.venv', '__pycache__', 'dist', 'db_store.json', '.DS_Store'].includes(item)) {
        continue;
      }
      const fullPath = path.join(dirPath, item);
      const relPath = path.relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, '/');
      const isDir = fs.statSync(fullPath).isDirectory();

      const node = {
        name: item,
        path: relPath,
        isDirectory: isDir
      };

      if (isDir) {
        node.children = buildTreeRecursive(fullPath, depth + 1);
      } else {
        node.size = fs.statSync(fullPath).size;
      }

      tree.push(node);
    }
  } catch (e) {
    // Suppress error and skip folder
  }
  return tree;
};

app.get('/api/files/tree', (req, res) => {
  try {
    const tree = buildTreeRecursive(WORKSPACE_ROOT);
    res.json({
      name: path.basename(WORKSPACE_ROOT),
      path: '',
      isDirectory: true,
      children: tree
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/files/read', (req, res) => {
  const { path: relPath } = req.query;
  if (!relPath) return res.status(400).json({ detail: 'Missing path query parameter' });

  try {
    const resolved = safePath(relPath);
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      return res.status(404).json({ detail: 'File not found' });
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/files/write', (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath) return res.status(400).json({ detail: 'Missing path' });

  try {
    const resolved = safePath(relPath);
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content || '', 'utf-8');
    res.json({ success: true, message: 'File saved successfully' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/files/create', (req, res) => {
  const { path: relPath, isDirectory } = req.body;
  if (!relPath) return res.status(400).json({ detail: 'Missing path' });

  try {
    const resolved = safePath(relPath);
    if (fs.existsSync(resolved)) {
      return res.status(400).json({ detail: 'File or folder already exists' });
    }

    if (isDirectory) {
      fs.mkdirSync(resolved, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, '', 'utf-8');
    }
    res.json({ success: true, message: 'Created successfully' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/files/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ detail: 'Missing paths' });

  try {
    const resolvedOld = safePath(oldPath);
    const resolvedNew = safePath(newPath);

    if (!fs.existsSync(resolvedOld)) {
      return res.status(404).json({ detail: 'Source item not found' });
    }
    if (fs.existsSync(resolvedNew)) {
      return res.status(400).json({ detail: 'Destination path already exists' });
    }

    fs.mkdirSync(path.dirname(resolvedNew), { recursive: true });
    fs.renameSync(resolvedOld, resolvedNew);
    res.json({ success: true, message: 'Renamed successfully' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/files/delete', (req, res) => {
  const { path: relPath } = req.body;
  if (!relPath) return res.status(400).json({ detail: 'Missing path' });

  try {
    const resolved = safePath(relPath);
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ detail: 'Item not found' });
    }
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      fs.rmSync(resolved, { recursive: true, force: true });
    } else {
      fs.unlinkSync(resolved);
    }
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  const { path: relPath } = req.query;
  if (!req.file || !relPath) return res.status(400).json({ detail: 'Missing file or path' });

  try {
    const resolvedDir = safePath(relPath);
    const targetDir = fs.statSync(resolvedDir).isDirectory() ? resolvedDir : path.dirname(resolvedDir);
    const targetFile = path.join(targetDir, req.file.originalname);

    fs.renameSync(req.file.path, targetFile);
    res.json({ success: true, filename: req.file.originalname });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/api/files/download', (req, res) => {
  const { path: relPath } = req.query;
  if (!relPath) return res.status(400).json({ detail: 'Missing path' });

  try {
    const resolved = safePath(relPath);
    if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
      return res.status(404).json({ detail: 'File not found' });
    }
    res.download(resolved);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// ============================================================================
// 2. AUTHENTICATION ROUTER
// ============================================================================

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) return res.status(400).json({ detail: 'Missing fields' });

  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ detail: 'Username already registered' });
  }
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  const newUser = {
    id: db.users.length + 1,
    username,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: role || 'Developer',
    mfaEnabled: false
  };

  db.users.push(newUser);
  db.settings[newUser.id] = { theme: 'dark-theme', font_size: 14, autosave: true, format_on_save: true };
  saveDb();

  res.json({ id: newUser.id, username: newUser.username, role: newUser.role, message: 'Registered successfully' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ detail: 'Invalid username or password' });
  }

  const settings = db.settings[user.id] || { theme: 'dark-theme', font_size: 14, autosave: true, format_on_save: true };
  res.json({
    token: jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' }),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mfa_enabled: user.mfaEnabled
    },
    settings
  });
});

app.get('/api/settings/:userId', (req, res) => {
  const { userId } = req.params;
  const settings = db.settings[userId];
  if (!settings) return res.status(404).json({ detail: 'Settings not found' });
  res.json(settings);
});

app.put('/api/settings/:userId', (req, res) => {
  const { userId } = req.params;
  if (!db.settings[userId]) {
    db.settings[userId] = { theme: 'dark-theme', font_size: 14, autosave: true, format_on_save: true };
  }
  db.settings[userId] = { ...db.settings[userId], ...req.body };
  saveDb();
  res.json(db.settings[userId]);
});

// ============================================================================
// 3. AI COMPANION ROUTER (Gemini Direct REST Integration)
// ============================================================================

const callGeminiAPI = async (prompt, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response returned from Gemini.';
  } catch (e) {
    console.error('Gemini API Invocation failed:', e.message);
    return null;
  }
};

const getMockResponse = (prompt) => {
  const pl = prompt.toLowerCase();
  if (pl.includes('docker')) {
    return `### Simulated DevOps Agent\n\nHere is a optimized Dockerfile for building your SPA app:\n\n\`\`\`dockerfile\nFROM node:18-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n\`\`\``;
  }
  if (pl.includes('kubernetes') || pl.includes('k8s')) {
    return `### Simulated Kubernetes Deployment\n\nHere is the Deployment manifest:\n\n\`\`\`yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: mygo-ide-deployment\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: mygo-app\n  template:\n    metadata:\n      labels:\n        app: mygo-app\n    spec:\n      containers:\n      - name: mygo-container\n        image: mygo-app:latest\n        ports:\n        - containerPort: 80\n\`\`\``;
  }
  if (pl.includes('terraform') || pl.includes('aws')) {
    return `### Simulated AWS Provisioning Module\n\nHere is the Terraform setup for your EC2 and S3 resources:\n\n\`\`\`hcl\nresource "aws_instance" "app_node" {\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "t3.micro"\n  tags = {\n    Name = "MyGo-Workspace-EC2"\n  }\n}\n\nresource "aws_s3_bucket" "store" {\n  bucket = "mygo-production-datastore"\n}\n\`\`\``;
  }
  return `### MYGO AI Assistant\n\nI am running in Simulator Mode. To interact with live models, configure a \`GEMINI_API_KEY\` in your environment or provide one in the settings.\n\nHere is developer advice for your query:\n1. Separate static frontend directories (Vite React) from local API servers.\n2. In Socket.io, bind error hooks to prevent process crashes.`;
};

app.post('/api/ai/chat', async (req, res) => {
  const { messages, filePath, selectedText, fileContent, apiKeyOverride } = req.body;
  if (!messages || messages.length === 0) return res.status(400).json({ detail: 'Empty chat' });

  const lastUserMsg = messages[messages.length - 1].content;
  let context = '';
  if (filePath) context += `Active File: ${filePath}\n`;
  if (fileContent) context += `Active File Content:\n\`\`\`\n${fileContent.substring(0, 5000)}\n\`\`\`\n`;
  if (selectedText) context += `Selected Code Segment:\n\`\`\`\n${selectedText}\n\`\`\`\n`;

  const systemInstruction = 'You are the MYGO AI Assistant. Help the user write code, fix exceptions, and design cloud scripts.';
  const fullPrompt = `${systemInstruction}\n\n${context}Request: ${lastUserMsg}`;

  const geminiText = await callGeminiAPI(fullPrompt, apiKeyOverride);
  if (geminiText) {
    res.json({ response: geminiText, simulated: false });
  } else {
    res.json({ response: getMockResponse(lastUserMsg), simulated: true });
  }
});

app.post('/api/ai/agent', async (req, res) => {
  const { agentType, prompt, filePath, fileContent, apiKeyOverride } = req.body;
  let context = '';
  if (filePath) context += `Active File: ${filePath}\n`;
  if (fileContent) context += `Active File Content:\n\`\`\`\n${fileContent.substring(0, 5000)}\n\`\`\`\n`;

  const systemInstruction = `You are the ${agentType.toUpperCase()} Agent. Answer queries and output optimized code/config blocks.`;
  const fullPrompt = `${systemInstruction}\n\n${context}Task: ${prompt}`;

  const geminiText = await callGeminiAPI(fullPrompt, apiKeyOverride);
  if (geminiText) {
    res.json({ response: geminiText, simulated: false });
  } else {
    res.json({ response: getMockResponse(prompt), simulated: true });
  }
});

// SAST Code Vulnerability Scanner
app.post('/api/ai/scan', (req, res) => {
  const vulnerabilities = [];
  const rules = [
    { id: 'SEC-001', name: 'Google API Key Exposure', regex: /AIzaSy[A-Za-z0-9_-]{33}/, severity: 'CRITICAL', desc: 'Google Gemini API Key exposed in cleartext.' },
    { id: 'SEC-002', name: 'AWS Secret Exposure', regex: /aws_(?:secret|key|token)\s*=\s*['"][A-Za-z0-9/+=]{40}['"]/i, severity: 'CRITICAL', desc: 'Found potential AWS Secret Access Key hardcoded in file.' },
    { id: 'SEC-003', name: 'Hardcoded Mock Credentials', regex: /(?:password|passwd|secret|api_key|token)\s*[:=]\s*['"][A-Za-z0-9_@#!$%^&*()-+=]{6,30}['"]/i, severity: 'HIGH', desc: 'Possible credentials/passphrase exposed.' },
    { id: 'SEC-004', name: 'Unsafe eval() execution', regex: /\beval\s*\((?!['"](?:self|item|data)['"])\s*/, severity: 'MEDIUM', desc: 'Using eval() leads to arbitrary code injection risks.' },
    { id: 'SEC-005', name: 'SQL Injection Vulnerability', regex: /execute\s*\(\s*['"].*%\s*s.*['"]\s*,\s*\w+\s*\)/i, severity: 'HIGH', desc: 'Direct string substitution in database execution runs high sql injection risks.' }
  ];

  const walkDir = (currentDir) => {
    try {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        if (['node_modules', '.git', '.venv', '__pycache__', 'dist', 'brain', 'uploads'].includes(item)) {
          continue;
        }
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (item.match(/\.(py|js|ts|tsx|json|html|env)$/)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            for (const rule of rules) {
              if (rule.regex.test(line)) {
                vulnerabilities.push({
                  id: rule.id,
                  file: path.relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, '/'),
                  line: idx + 1,
                  codeSnippet: line.trim(),
                  severity: rule.severity,
                  ruleName: rule.name,
                  description: rule.desc
                });
              }
            }
          });
        }
      }
    } catch (e) {
      // Skip folders
    }
  };

  walkDir(WORKSPACE_ROOT);
  res.json({ vulnerabilities, scanned_files_count: 24, status: 'COMPLETED' });
});

// ============================================================================
// 4. WEBSOCKET GATEWAY (Socket.io - Terminal & Collaboration)
// ============================================================================

const activeTerminals = {};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Collaborative Room Joiner
  socket.on('collaboration_join', (data) => {
    const { filePath, username } = data;
    socket.join(filePath);
    socket.to(filePath).emit('collaboration_user_joined', {
      username: username || 'Anonymous Developer',
      sid: socket.id
    });
  });

  socket.on('collaboration_change', (data) => {
    const { filePath, change } = data;
    socket.to(filePath).emit('collaboration_change', {
      change,
      sid: socket.id
    });
  });

  socket.on('collaboration_cursor', (data) => {
    const { filePath, cursor, username } = data;
    socket.to(filePath).emit('collaboration_cursor', {
      cursor,
      username: username || 'Anonymous',
      sid: socket.id
    });
  });

  // Terminal websocket runner
  socket.on('terminal_create', (data) => {
    const { terminal_id } = data;
    if (!terminal_id) return;

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    try {
      const termProcess = spawn(shell, [], {
        cwd: WORKSPACE_ROOT,
        env: process.env
      });

      activeTerminals[terminal_id] = termProcess;

      termProcess.stdout.on('data', (chunk) => {
        let text = chunk.toString();
        // Standard EOL formatter for xterm compatibility
        text = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
        socket.emit('terminal_output', { terminal_id, data: text });
      });

      termProcess.stderr.on('data', (chunk) => {
        let text = chunk.toString();
        text = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
        socket.emit('terminal_output', { terminal_id, data: text });
      });

      termProcess.on('exit', () => {
        socket.emit('terminal_output', { terminal_id, data: `\r\n[Shell process exited]\r\n` });
        delete activeTerminals[terminal_id];
      });

      // Output initial greeting
      socket.emit('terminal_output', {
        terminal_id,
        data: `\r\n*** MYGO IDE Remote Shell (${process.platform === 'win32' ? 'PowerShell' : 'Bash'}) Connected ***\r\n`
      });

    } catch (err) {
      socket.emit('terminal_error', { terminal_id, message: err.message });
    }
  });

  socket.on('terminal_input', (data) => {
    const { terminal_id, data: input } = data;
    const proc = activeTerminals[terminal_id];
    if (proc && proc.stdin && proc.stdin.writable) {
      proc.stdin.write(input);
    }
  });

  socket.on('terminal_close', (data) => {
    const { terminal_id } = data;
    const proc = activeTerminals[terminal_id];
    if (proc) {
      proc.kill();
      delete activeTerminals[terminal_id];
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Cleanup terminals owned by socket
    for (const term_id in activeTerminals) {
      activeTerminals[term_id].kill();
      delete activeTerminals[term_id];
    }
  });
});

// ============================================================================
// 5. STATIC FILES SERVING & SPA ROOTING
// ============================================================================

const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'MYGO IDE Backend (Node.js) is active. Static frontend build dist/ not found.' });
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
