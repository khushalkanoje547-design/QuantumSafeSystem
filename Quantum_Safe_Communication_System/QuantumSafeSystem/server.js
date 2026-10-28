// server.js (root folder mein banayein)
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security middleware
app.use(helmet());

// Ab server specifically 'frontend' folder se files serve karega
app.use(express.static(path.join(__dirname, 'frontend')));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});