const path = require('path');
const express = require('express');
const http = require('http');
const hpp = require('hpp');
const cors = require('cors');
const { WebSocketServer } = require('bun-ws-router');

// Load application config
require('dotenv').config({ path: './config/config.env' });

// Init express app & create http server
const app = express();
const server = http.createServer(app);

// Create socket server
const wss = new WebSocketServer();

// Load database
require('./database')();

// Init page settings
require('./utils/setting').settingInitDatabase();

// Enable if you are behind a reverse proxy
app.set('trust proxy', 1);

// Set other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(cors({
    origin: [...process.env.SERVER_FRONTEND_URL.split(',')],
    credentials: true
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Mount routes
app.use('/', require('./routes')());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Mount sockets
require('./sockets')(wss);

// Set app port
const PORT = process.env.SERVER_PORT || 5000;

server.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
