// Install dependencies: npm install express socket.io body-parser cors
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve frontend files

let users = [];
let messages = {}; // {chatId: [{from,text,time}]}
let nextId = 1;

// Create user
app.post('/api/create', (req, res) => {
    const { name, age, gender, mobile, password, photo } = req.body;
    if (users.find(u => u.mobile === mobile)) return res.json({ error: 'User exists' });
    const newUser = { id: nextId++, name, age, gender, mobile, password, photo, likes: [], matches: [], premium: false, premiumGranted: 0, verified: false, msgCount: {} };
    users.push(newUser);
    res.json(newUser);
});

// Login
app.post('/api/login', (req, res) => {
    const { mobile, password } = req.body;
    const u = users.find(x => x.mobile === mobile && x.password === password);
    if (!u) return res.json({ error: 'Invalid login' });
    res.json(u);
});

// Get all users
app.get('/api/users', (req, res) => res.json(users));

// Update user
app.post('/api/user/update', (req, res) => {
    const idx = users.findIndex(u => u.id === req.body.id);
    if (idx === -1) return res.json({ error: 'User not found' });
    users[idx] = {...users[idx], ...req.body };
    res.json(users[idx]);
});

// --- Socket.io for live chat ---
io.on('connection', socket => {
    console.log('New connection', socket.id);
    socket.on('join', userId => {
        socket.join('user_' + userId);
    });
    socket.on('chat', data => {
        const { from, to, text } = data;
        const time = new Date().toLocaleTimeString();
        const chatId = [from, to].sort().join('_');
        if (!messages[chatId]) messages[chatId] = [];
        messages[chatId].push({ from, text, time });
        io.to('user_' + to).emit('receive', { from, text, time });
        io.to('user_' + from).emit('receive', { from, text, time });
    });
});

http.listen(3000, () => console.log('Server running on http://localhost:3000'));