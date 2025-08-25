const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Mock data for development
let customers = [];
let sessions = [];

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send current state to newly connected client
    socket.emit('initial_data', { customers, sessions });

    socket.on('add_customer', (customer) => {
        customers.push(customer);
        io.emit('customer_added', customer);
    });

    socket.on('update_customer', (update) => {
        const index = customers.findIndex(c => c.id === update.id);
        if (index !== -1) {
            customers[index] = { ...customers[index], ...update.updates };
            io.emit('customer_updated', customers[index]);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Basic API endpoints for future use
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/customers', (req, res) => {
    res.json(customers);
});

app.get('/api/sessions', (req, res) => {
    res.json(sessions);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});