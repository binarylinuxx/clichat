// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

let messages = [];
const MAX_MESSAGES = 100;
const users = new Map();
const userColors = new Map();

const COLORS = [
  'red', 'green', 'yellow', 'blue', 'magenta', 'cyan',
  'brightRed', 'brightGreen', 'brightYellow', 'brightBlue',
  'brightMagenta', 'brightCyan'
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', (username) => {
    const color = getRandomColor();
    users.set(socket.id, username);
    userColors.set(socket.id, color);

    io.emit('userJoined', {
      username,
      color,
      timestamp: Date.now()
    });

    console.log(`${username} joined the chat with color ${color}`);
  });

  socket.on('message', (data) => {
    const color = userColors.get(socket.id) || 'white';
    const messageData = {
      username: data.username,
      message: data.message,
      color: color,
      timestamp: Date.now()
    };

    messages.push(messageData);

    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(-MAX_MESSAGES);
    }

    io.emit('message', messageData);
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      io.emit('userLeft', {
        username,
        timestamp: Date.now()
      });
      users.delete(socket.id);
      userColors.delete(socket.id);
      console.log(`${username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Users can connect with: node client.js`);
});
