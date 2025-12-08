// client.js
const io = require('socket.io-client');
const readline = require('readline');

const SERVER_URL = 'http://localhost:3000';

let username = '';
let messages = [];
const MAX_MESSAGES = 100;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '>>_ '
});

function clearScreen() {
  console.clear();
}

function renderUI() {
  clearScreen();
  
  console.log('='.repeat(process.stdout.columns || 80));
  console.log('WARNING: Your Account will be destroyed once your session destroyed');
  console.log('         and each message before 100 auto delete to optimize storage');
  console.log('='.repeat(process.stdout.columns || 80));
  console.log('');
  
  const displayMessages = messages.slice(-20);
  displayMessages.forEach(msg => {
    console.log(msg);
  });
  
  console.log('');
  console.log('-'.repeat(process.stdout.columns || 80));
  rl.prompt();
}

async function getUserName() {
  return new Promise((resolve) => {
    rl.question('Input your Name: ', (name) => {
      resolve(name.trim() || 'Anonymous');
    });
  });
}

async function main() {
  clearScreen();
  username = await getUserName();
  
  const socket = io(SERVER_URL, {
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
    messages.push(`[SYSTEM] ${data.username} joined the chat`);
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
    messages.push(`[${timestamp}] ${data.username}: ${data.message}`);
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
