// client.js
const io = require('socket.io-client');
const readline = require('readline');

// Using manual choice url
//const SERVER_URL = 'http://server.binary.sophron.ru';

let username = '';
let messages = [];
const MAX_MESSAGES = 100;

let terminalWidth = process.stdout.columns || 80;
let terminalHeight = process.stdout.rows || 24;
let chatBoxHeight = 0;
let headerHeight = 4;
let footerHeight = 2;

const ANSI_COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m'
};

function colorize(text, color) {
  const colorCode = ANSI_COLORS[color] || ANSI_COLORS.white;
  return `${colorCode}${text}${ANSI_COLORS.reset}`;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>> '
});

function updateTerminalSize() {
  terminalWidth = process.stdout.columns || 80;
  terminalHeight = process.stdout.rows || 24;
  chatBoxHeight = Math.max(terminalHeight - headerHeight - footerHeight - 1, 5);
}

process.stdout.on('resize', () => {
  updateTerminalSize();
  renderUI();
});

function moveCursor(row, col) {
  process.stdout.write(`\x1b[${row};${col}H`);
}

function clearLine() {
  process.stdout.write('\x1b[2K');
}

function clearFromCursor() {
  process.stdout.write('\x1b[J');
}

function hideCursor() {
  process.stdout.write('\x1b[?25l');
}

function showCursor() {
  process.stdout.write('\x1b[?25h');
}

function clearScreen() {
  process.stdout.write('\x1b[2J');
  moveCursor(1, 1);
}

function truncateText(text, maxWidth) {
  if (text.length <= maxWidth) return text;
  return text.substring(0, maxWidth - 3) + '...';
}

function renderUI() {
  updateTerminalSize();
  hideCursor();

  moveCursor(1, 1);
  clearFromCursor();

  process.stdout.write('='.repeat(terminalWidth) + '\n');
  process.stdout.write(truncateText('WARNING: Your Account will be destroyed once your session destroyed', terminalWidth) + '\n');
  process.stdout.write(truncateText('         and each message before 100 auto delete to optimize storage', terminalWidth) + '\n');
  process.stdout.write('='.repeat(terminalWidth) + '\n');

  const chatStartRow = headerHeight + 1;
  const displayMessages = messages.slice(-chatBoxHeight);

  for (let i = 0; i < chatBoxHeight; i++) {
    moveCursor(chatStartRow + i, 1);
    clearLine();
    if (i < displayMessages.length) {
      const msg = truncateText(displayMessages[i], terminalWidth);
      process.stdout.write(msg);
    }
  }

  const footerRow = chatStartRow + chatBoxHeight;
  moveCursor(footerRow, 1);
  process.stdout.write('-'.repeat(terminalWidth));

  const inputRow = footerRow + 1;
  moveCursor(inputRow, 1);
  clearLine();

  showCursor();
  rl.prompt(true);
}

async function getUserName() {
  return new Promise((resolve) => {
    rl.question('Input your Name: ', (name) => {
      resolve(name.trim() || 'Anonymous');
    });
  });
}

// Chioice your server. Alternative is server.binary.sophron.ru
async function getServerUrl() {
  return new Promise((resolve) => {
    rl.question('Enter server URL: ', (url) => {
      const cleanUrl = url.trim();
      if (!cleanUrl) {
        resolve('http://server.binary.sophron.ru'); 
      } else {
        resolve(cleanUrl);
      }
    });
  });
}

async function main() {
  updateTerminalSize();
  clearScreen();
  
  username = await getUserName();
  server_url = await getServerUrl();
  
  const socket = io(server_url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    socket.emit('join', username);
    messages.push(`[SYSTEM] Connected as ${username}`);
    renderUI();
  });

  socket.on('userJoined', (data) => {
    const coloredUsername = colorize(data.username, data.color);
    messages.push(`[SYSTEM] ${coloredUsername} joined the chat`);
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    renderUI();
  });

  socket.on('userLeft', (data) => {
    messages.push(`[SYSTEM] ${data.username} left the chat`);
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    renderUI();
  });

  socket.on('message', (data) => {
    const timestamp = new Date(data.timestamp).toLocaleTimeString();
    const coloredUsername = colorize(data.username, data.color);
    messages.push(`[${timestamp}] ${coloredUsername}: ${data.message}`);
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }
    renderUI();
  });

  socket.on('disconnect', () => {
    messages.push('[SYSTEM] Disconnected from server');
    renderUI();
  });

  socket.on('error', (error) => {
    messages.push(`[ERROR] ${error}`);
    renderUI();
  });

  rl.on('line', (input) => {
    const message = input.trim();
    
    if (message === '/quit' || message === '/exit') {
      socket.disconnect();
      console.log('Goodbye!');
      process.exit(0);
    }
    
    if (message) {
      socket.emit('message', { message, username });
    }
    
    rl.prompt();
  });

  rl.on('close', () => {
    socket.disconnect();
    process.exit(0);
  });
}

main().catch(console.error);
