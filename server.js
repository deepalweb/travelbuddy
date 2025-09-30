// Simple server entry point for Azure
const path = require('path');
const serverPath = path.join(__dirname, 'backend', 'server.js');
require(serverPath);