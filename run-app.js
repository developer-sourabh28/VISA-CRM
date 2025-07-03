// VISA-CRM Application Startup Helper
// This script helps ensure both server and client are running properly

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define colors for console output
const colors = {
  client: '\x1b[36m', // Cyan
  server: '\x1b[32m', // Green
  reset: '\x1b[0m'    // Reset
};

console.log(`${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════╗
║                                                ║
║       VISA-CRM Application Startup Helper      ║
║                                                ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

// Check if we're in the right directory
const isProjectRoot = fs.existsSync('./server') && fs.existsSync('./client');
if (!isProjectRoot) {
  console.error(`${colors.red}Error: This script must be run from the project root directory.${colors.reset}`);
  process.exit(1);
}

// Helper function to create a process and pipe its output
function startProcess(name, cmd, args, cwd) {
  console.log(`${colors[name]}Starting ${name}...${colors.reset}`);
  
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'npm.cmd' : 'npm';
  
  const proc = spawn(command, args, { 
    cwd: path.resolve(__dirname, cwd),
    stdio: 'pipe',
    shell: isWindows
  });
  
  proc.stdout.on('data', (data) => {
    console.log(`${colors[name]}[${name}] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`${colors[name]}[${name} ERROR] ${data.toString().trim()}${colors.reset}`);
  });
  
  proc.on('close', (code) => {
    console.log(`${colors[name]}[${name}] process exited with code ${code}${colors.reset}`);
  });
  
  return proc;
}

// Start the client process
const clientProcess = startProcess('client', 'npm', ['run', 'dev'], 'client');

// Start the server process
const serverProcess = startProcess('server', 'npm', ['run', 'dev'], 'server');

// Handle signals to gracefully shut down all processes
const shutdown = () => {
  console.log('\nShutting down all processes...');
  
  if (clientProcess) {
    clientProcess.kill();
  }
  
  if (serverProcess) {
    serverProcess.kill();
  }
  
  process.exit(0);
};

// Listen for termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\nPress Ctrl+C to stop all processes.'); 