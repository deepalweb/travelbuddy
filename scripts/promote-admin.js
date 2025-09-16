#!/usr/bin/env node
// Promote a Firebase user to admin via backend endpoint using ADMIN_API_KEY
import https from 'https';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      out[k.replace(/^--/, '')] = v ?? args[i + 1];
      if (!a.includes('=') && args[i + 1] && !args[i + 1].startsWith('--')) i++;
    }
  }
  return out;
}

const {
  email,
  password,
  displayName,
  url = process.env.APP_URL || 'https://travelbuddy.azurewebsites.net',
  key = process.env.ADMIN_API_KEY,
} = parseArgs();

if (!email) {
  console.error('Usage: node scripts/promote-admin.js --email you@example.com [--password pass] [--displayName "Your Name"] [--url https://<app>.azurewebsites.net] [--key <ADMIN_API_KEY>]');
  process.exit(1);
}
if (!key) {
  console.error('Missing ADMIN_API_KEY. Pass with --key or set env ADMIN_API_KEY.');
  process.exit(1);
}

const payload = JSON.stringify({ email, password, displayName });
const endpoint = new URL('/api/admin/users', url);

const req = https.request({
  method: 'POST',
  hostname: endpoint.hostname,
  path: endpoint.pathname,
  protocol: endpoint.protocol,
  headers: {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
    'x-admin-api-key': key,
  },
}, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    if (res.statusCode && res.statusCode < 300) {
      console.log('✅ Admin promotion succeeded');
      console.log(body);
      process.exit(0);
    } else {
      console.error(`❌ Failed (${res.statusCode})`);
      console.error(body);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  process.exit(1);
});

req.write(payload);
req.end();
