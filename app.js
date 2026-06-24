// ==========================================
// MYGO IDE - CORE INTERACTIVITY & COMPILER
// ==========================================

// 1. Mock Filesystem Database
const mockFilesystem = {
  'mygo_mobile_project/mobile/App.tsx': `/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#034354"
      />
      {isLoggedIn ? (
        <MainScreen onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </SafeAreaProvider>
  );
}

export default App;`,

  'mygo_mobile_project/mobile/app.json': `{
  "expo": {
    "name": "mygo_mobile_project",
    "slug": "mygo_mobile_project",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}`,

  'mygo_mobile_project/mobile/package.json': `{
  "name": "mygo_mobile_project",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "ts:check": "tsc"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "react-native-safe-area-context": "4.10.1"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "~5.3.3"
  },
  "private": true
}`,

  'mygo_mobile_project/api/MyGo.API/Program.cs': `var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}`,

  'mygo_mobile_project/api/MyGo.API/MyGo.API.csproj': `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.0-preview.3" />
  </ItemGroup>

</Project>`,

  'mygo_mobile_project/api/MyGo.API/appsettings.json': `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}`
};

// 2. Editor State
let currentPath = 'mygo_mobile_project/mobile/App.tsx';
let openedFiles = ['mygo_mobile_project/mobile/App.tsx'];

// DOM Elements
const codeEditor = document.getElementById('code-editor');
const highlightCode = document.getElementById('highlight-code');
const lineNumbersCol = document.getElementById('line-numbers-col');
const tabsContainer = document.getElementById('editor-tabs-container');
const runBtn = document.getElementById('run-btn');
const saveBtn = document.getElementById('save-btn');
const themeBtn = document.getElementById('theme-btn');
const consoleOutput = document.getElementById('console-output');
const terminalInput = document.getElementById('terminal-input');
const fileTreeRoot = document.getElementById('file-tree-root');

// ==========================================
// CODE SYNTAX HIGHLIGHTING ENGINE
// ==========================================

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightSyntax(code, filePath) {
  let escaped = escapeHTML(code);
  const ext = filePath.split('.').pop();
  
  if (ext === 'json') {
    // Basic JSON highlighing
    return escaped
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")/g, '<span class="syntax-string">$1</span>')
      .replace(/(\b-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?\b)/g, '<span class="syntax-number">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="syntax-keyword">$1</span>');
  } 
  
  if (ext === 'cs') {
    // C# Syntax Highlighting
    return escaped
      .replace(/(\/\/.*)/g, '<span class="syntax-comment">$1</span>')
      .replace(/\b(var|builder|app|new|var|record|int|string|return|if|using|namespace|class|public|private|void|static)\b/g, '<span class="syntax-keyword">$1</span>')
      .replace(/(".*?")/g, '<span class="syntax-string">$1</span>')
      .replace(/(\b\d+\b)/g, '<span class="syntax-number">$1</span>')
      .replace(/(\.\w+)(?=\()/g, '.<span class="syntax-function">$1</span>')
      .replace(/(\b[A-Z]\w+)/g, '<span class="syntax-type">$1</span>');
  }

  // TSX / JS highlighting
  return escaped
    .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>')
    .replace(/\b(const|let|var|function|return|import|from|export|default|false|true|isDarkMode|isLoggedIn)\b/g, '<span class="syntax-keyword">$1</span>')
    .replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span class="syntax-string">$1</span>')
    .replace(/(\b\d+\b)/g, '<span class="syntax-number">$1</span>')
    .replace(/(\w+)(?=\()/g, '<span class="syntax-function">$1</span>')
    .replace(/(&lt;\/?[a-zA-Z]+&gt;|&lt;[a-zA-Z]+\b.*?\/&gt;)/g, '<span class="syntax-type">$1</span>');
}

// ==========================================
// EDITOR OPERATIONS
// ==========================================

function updateLineNumbers(code) {
  const lineCount = code.split('\n').length;
  let html = '';
  for (let i = 1; i <= lineCount; i++) {
    html += `<div class="line-number">${i}</div>`;
  }
  lineNumbersCol.innerHTML = html;
}

function loadFile(filePath) {
  if (!(filePath in mockFilesystem)) return;
  
  currentPath = filePath;
  const content = mockFilesystem[filePath];
  codeEditor.value = content;
  
  updateLineNumbers(content);
  highlightCode.innerHTML = highlightSyntax(content, filePath);
  
  // Highlight active item in tree explorer
  document.querySelectorAll('.file-tree .file').forEach(el => {
    if (el.getAttribute('data-path') === filePath) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  renderTabs();
}

function saveCurrentFile() {
  mockFilesystem[currentPath] = codeEditor.value;
  writeTerminalLine(`System: Saved changes to [${currentPath.split('/').pop()}] successfully.`, 'success-msg');
}

// Sync Scrolling of Textarea & Highlight Div
codeEditor.addEventListener('scroll', () => {
  const overlay = document.getElementById('highlight-overlay');
  overlay.scrollTop = codeEditor.scrollTop;
  overlay.scrollLeft = codeEditor.scrollLeft;
});

// Update highlighting on type
codeEditor.addEventListener('input', () => {
  const code = codeEditor.value;
  updateLineNumbers(code);
  highlightCode.innerHTML = highlightSyntax(code, currentPath);
});

// Support Tab Key Indentation in Editor
codeEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    const val = codeEditor.value;
    codeEditor.value = val.substring(0, start) + '  ' + val.substring(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
    // trigger input
    highlightCode.innerHTML = highlightSyntax(codeEditor.value, currentPath);
  }
});

// ==========================================
// EDITOR TABS MANAGEMENT
// ==========================================

function renderTabs() {
  tabsContainer.innerHTML = '';
  openedFiles.forEach(filePath => {
    const filename = filePath.split('/').pop();
    const isActive = filePath === currentPath;
    
    const tabEl = document.createElement('div');
    tabEl.className = `tab ${isActive ? 'active' : ''}`;
    tabEl.setAttribute('data-path', filePath);
    
    // Get correct icon class
    let iconClass = 'fa-solid fa-code';
    if (filename.endsWith('.json')) iconClass = 'fa-solid fa-gear json-icon';
    else if (filename.endsWith('.js')) iconClass = 'fa-solid fa-square-js js-icon';
    else if (filename.endsWith('.cs')) iconClass = 'fa-solid fa-hashtag cs-icon';
    else if (filename.endsWith('.csproj')) iconClass = 'fa-solid fa-file-code xml-icon';
    else if (filename.endsWith('.tsx')) iconClass = 'fa-solid fa-code tsx-icon';

    tabEl.innerHTML = `
      <span class="tab-name"><i class="${iconClass}"></i> ${filename}</span>
      <span class="tab-close"><i class="fa-solid fa-xmark"></i></span>
    `;

    // Click Tab to Load File
    tabEl.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) {
        e.stopPropagation();
        closeTab(filePath);
      } else {
        loadFile(filePath);
      }
    });

    tabsContainer.appendChild(tabEl);
  });
}

function openTab(filePath) {
  if (!openedFiles.includes(filePath)) {
    openedFiles.push(filePath);
  }
  loadFile(filePath);
}

function closeTab(filePath) {
  const index = openedFiles.indexOf(filePath);
  if (index === -1) return;
  
  openedFiles.splice(index, 1);
  if (currentPath === filePath) {
    if (openedFiles.length > 0) {
      loadFile(openedFiles[openedFiles.length - 1]);
    } else {
      codeEditor.value = '';
      highlightCode.innerHTML = '';
      lineNumbersCol.innerHTML = '';
      currentPath = '';
    }
  }
  renderTabs();
}

// ==========================================
// FILE EXPLORER INTERACTION
// ==========================================

fileTreeRoot.addEventListener('click', (e) => {
  const label = e.target.closest('.tree-label');
  if (!label) return;

  const item = label.closest('.tree-item');
  if (item.classList.contains('folder')) {
    item.classList.toggle('collapsed');
    const folderIcon = label.querySelector('.folder-icon');
    const toggleIcon = label.querySelector('.toggle-icon');
    
    if (item.classList.contains('collapsed')) {
      folderIcon.className = 'fa-regular fa-folder folder-icon';
      toggleIcon.className = 'fa-solid fa-chevron-down toggle-icon';
    } else {
      folderIcon.className = 'fa-regular fa-folder-open folder-icon';
      toggleIcon.className = 'fa-solid fa-chevron-down toggle-icon';
    }
  } else if (item.classList.contains('file')) {
    const path = item.getAttribute('data-path');
    openTab(path);
  }
});

// ==========================================
// TERMINAL RUNNER SIMULATION
// ==========================================

function writeTerminalLine(text, styleClass = '') {
  const line = document.createElement('div');
  line.className = `terminal-line ${styleClass}`;
  line.textContent = text;
  
  // Insert before the input line
  const inputLine = consoleOutput.querySelector('.terminal-input-line');
  consoleOutput.insertBefore(line, inputLine);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function handleCommand(cmd) {
  const trimmed = cmd.trim().toLowerCase();
  writeTerminalLine(`mygo-user@desktop MINGW64 /mygo-project $ ${cmd}`);
  
  if (trimmed === 'clear') {
    const lines = consoleOutput.querySelectorAll('.terminal-line');
    lines.forEach(line => line.remove());
    return;
  }
  
  if (trimmed === 'help') {
    writeTerminalLine('Available Commands:', 'info-msg');
    writeTerminalLine('  npm run dev   - Build and start Metro Bundler for Expo App');
    writeTerminalLine('  dotnet run    - Build and launch the ASP.NET Core API server');
    writeTerminalLine('  git status    - Show git repository status');
    writeTerminalLine('  clear         - Clear terminal console');
    writeTerminalLine('  help          - List available developer actions');
    return;
  }
  
  if (trimmed === 'npm run dev' || trimmed === 'npm start') {
    runExpoAppSimulation();
    return;
  }
  
  if (trimmed === 'dotnet run') {
    runDotnetApiSimulation();
    return;
  }

  if (trimmed === 'git status') {
    writeTerminalLine('On branch main', 'info-msg');
    writeTerminalLine('Your branch is up to date with \'origin/main\'.');
    writeTerminalLine('Changes not staged for commit:');
    writeTerminalLine('  (use "git add <file>..." to update what will be committed)');
    writeTerminalLine(`\tmodified:   mobile/App.tsx`, 'error-msg');
    writeTerminalLine('no changes added to commit (use "git add" and/or "git commit -a")');
    return;
  }

  // Fallback
  writeTerminalLine(`command not found: ${cmd}. Type "help" for a list of valid commands.`, 'error-msg');
}

function runExpoAppSimulation() {
  writeTerminalLine('Starting Metro Bundler...', 'info-msg');
  setTimeout(() => {
    writeTerminalLine('› Running Metro Bundler on port 8081', 'info-msg');
    writeTerminalLine('› Tunnel ready. QR code generated.', 'info-msg');
    writeTerminalLine('› Press a │ open Android emulator', 'info-msg');
    writeTerminalLine('› Press i │ open iOS simulator', 'info-msg');
    writeTerminalLine('› Expo Mobile client connected to localhost:8081', 'success-msg');
    writeTerminalLine('› [Bundle] Compiling App.tsx...', 'info-msg');
    setTimeout(() => {
      writeTerminalLine('✓ Compiled successfully in 1240ms!', 'success-msg');
    }, 1000);
  }, 800);
}

function runDotnetApiSimulation() {
  writeTerminalLine('Building MyGo.API.csproj...', 'info-msg');
  setTimeout(() => {
    writeTerminalLine('MSBuild version 17.10.0 for .NET', 'info-msg');
    writeTerminalLine('  Determining projects to restore...', 'info-msg');
    writeTerminalLine('  Restored MyGo.API.csproj (in 182 ms).', 'info-msg');
    setTimeout(() => {
      writeTerminalLine('  MyGo.API -> bin/Debug/net9.0/MyGo.API.dll', 'success-msg');
      writeTerminalLine('info: Microsoft.Hosting.Lifetime[14]', 'info-msg');
      writeTerminalLine('      Now listening on: http://localhost:5000', 'success-msg');
      writeTerminalLine('info: Microsoft.Hosting.Lifetime[0]', 'info-msg');
      writeTerminalLine('      Application started. Press Ctrl+C to shut down.', 'info-msg');
    }, 1200);
  }, 600);
}

terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const cmd = terminalInput.value;
    if (cmd.trim() !== '') {
      handleCommand(cmd);
      terminalInput.value = '';
    }
  }
});

// Click Run button compiles whichever context is currently active
runBtn.addEventListener('click', () => {
  writeTerminalLine('Triggering compiler runner for current workspace context...', 'system-msg');
  if (currentPath.includes('mobile')) {
    runExpoAppSimulation();
  } else {
    runDotnetApiSimulation();
  }
});

// Save button action
saveBtn.addEventListener('click', () => {
  saveCurrentFile();
});

// Clear terminal panel action
document.getElementById('clear-console').addEventListener('click', () => {
  const lines = consoleOutput.querySelectorAll('.terminal-line');
  lines.forEach(line => line.remove());
});

// Theme switcher action
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  document.body.classList.toggle('dark-theme');
  writeTerminalLine(`System: Interface theme toggled.`, 'info-msg');
});

// Initialize workspace load
loadFile('mygo_mobile_project/mobile/App.tsx');
