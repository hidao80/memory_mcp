const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the memory file path from user configuration
const memoryFilePath = process.env.memory_file_path;

// Validate memory file path
if (!memoryFilePath) {
    console.error('Error: memory_file_path environment variable is not set');
    console.error('Please configure the memory file path in the DXT settings');
    process.exit(1);
}

// Construct the path to main.py in the current directory
const mainPyPath = path.join(__dirname, 'main.py');

// Check if main.py exists
if (!fs.existsSync(mainPyPath)) {
    console.error(`Error: main.py not found at ${mainPyPath}`);
    console.error('Available files in directory:', fs.readdirSync(__dirname));
    process.exit(1);
}

console.log(`Using main.py path: ${mainPyPath}`);
console.log(`Using memory file path: ${memoryFilePath}`);

// Start the Python MCP server
const pythonCommand = 'python';
const pythonProcess = spawn(pythonCommand, [mainPyPath, memoryFilePath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: __dirname
});

// Handle process events
pythonProcess.on('error', (error) => {
    console.error('Failed to start Python MCP server:', error);
    process.exit(1);
});

pythonProcess.on('exit', (code) => {
    console.log(`Python MCP server exited with code ${code}`);
    // Don't exit the Node.js process, keep it running
    // The DXT framework will handle restart if needed
});

// Keep the Node.js process alive
process.stdin.resume();

// Handle process termination
process.on('SIGINT', () => {
    pythonProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    pythonProcess.kill('SIGTERM');
});

console.log(`Starting Memory MCP Server with: ${mainPyPath}`);

// Keep the process alive indefinitely
setInterval(() => {
    // This keeps the event loop active
}, 1000);

console.log('Memory MCP Server is running in background...');
