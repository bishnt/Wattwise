require('dotenv').config();
const app = require('./app');
const http = require('http');
const { initializeWebSocket } = require('./src/websocket/meterSocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initializeWebSocket(server);

server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
})

process.on('SIGTERM', () => {
    console.log('SIGTERM signal recieved: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});