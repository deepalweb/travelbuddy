const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'dist', 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

// Replace tokens with environment variables
config = config.replace(/#{(\w+)}#/g, (match, key) => {
  return process.env[key] || match;
});

fs.writeFileSync(configPath, config);
console.log('✅ Tokens replaced in config.js');
