import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('Asbestos Inspection Management System');
console.log('Unified Development Environment');
console.log('========================================\n');

// Find the correct Path variable (case-insensitive on Windows)
const env = { ...process.env };
const pathKey = Object.keys(env).find(k => k.toLowerCase() === 'path') || 'Path';

// Add local node_modules\.bin to the path
const binPath = path.join(__dirname, 'node_modules', '.bin');
env[pathKey] = binPath + path.delimiter + (env[pathKey] || '');

// 1. Start Backend
console.log('[1] Starting Backend Server...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env
});

backend.on('error', (err) => {
  console.error('[ERROR] Failed to start backend:', err);
});

// Give it a moment to start
setTimeout(() => {
  // 2. Start Frontend
  console.log('\n[2] Starting Frontend Dev Server...');
  
  // Use 'npx vite' as a fallback if 'vite.cmd' isn't directly found
  const frontend = spawn('vite.cmd', [], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
    env
  });

  frontend.on('error', (err) => {
    console.error('[ERROR] Failed to start frontend:', err);
  });

  process.on('SIGINT', () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });
}, 3000);
