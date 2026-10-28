// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(helmet());
app.use(express.json()); // JSON requests parse karne ke liye
app.use(express.static(path.join(__dirname, 'frontend')));

// In-memory databases (Phase 5 mein inko MongoDB se replace karenge)
const users = []; // Form: { username, passwordHash }
const activeSessions = new Map(); // Form: username -> socket.id

// --- API ROUTES ---

// 1. Register API
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "User already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ username, passwordHash });
    res.json({ message: "Registration successful" });
});

// 2. Login API
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ error: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    
    res.json({ message: "Login successful", username });
});


// --- SOCKET.IO REAL-TIME E2E ROUTING ---
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Jab user login karke socket connect karega
    socket.on('register_user', (username) => {
        activeSessions.set(username, socket.id);
        console.log(`${username} registered with socket ${socket.id}`);
    });

    // Quantum-Safe E2E Message Forwarding (Server ko kuch samajh nahi aayega, sirf aage bhejega)
    socket.on('send_secure_message', (data) => {
        const { sender, receiver, ciphertext, nonce, authTag } = data;
        
        console.log(`Routing encrypted message from ${sender} to ${receiver}`);
        // Log karke check kar sakte hain ki sirf gibberish (ciphertext) hi dikh raha hai
        console.log(`Payload snippet: ${ciphertext.substring(0, 15)}...`);

        const receiverSocketId = activeSessions.get(receiver);
        if (receiverSocketId) {
            // Receiver ko encrypted data forward kar do
            io.to(receiverSocketId).emit('receive_secure_message', {
                sender,
                ciphertext,
                nonce,
                authTag,
                timestamp: new Date().toISOString()
            });
        }
    });

    socket.on('disconnect', () => {
        // Disconnect hone par session remove karna
        for (let [username, id] of activeSessions.entries()) {
            if (id === socket.id) {
                activeSessions.delete(username);
                console.log(`${username} disconnected`);
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Phase 3 Deliverable: Server running with E2E routing on port ${PORT}`);
});