import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'dist', 'config.js');
let config = fs.readFileSync(configPath, 'utf8');

config = config.replace(/#{(\w+)}#/g, (match, key) => {
  return process.env[key] || match;
});

fs.writeFileSync(configPath, config);
console.log('✅ Tokens replaced in config.js');
