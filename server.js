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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join', (username) => {
    users.set(socket.id, username);
    
    io.emit('userJoined', {
      username,
      timestamp: Date.now()
    });
    
    console.log(`${username} joined the chat`);
  });

  socket.on('message', (data) => {
    const messageData = {
      username: data.username,
      message: data.message,
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
      console.log(`${username} left the chat`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Users can connect with: node client.js`);
});
