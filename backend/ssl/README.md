# SSL Certificates

For production deployment, place your SSL certificates in this directory:

- `cert.pem` - SSL certificate
- `key.pem` - Private key
- `chain.pem` - Certificate chain (optional)

## Development

For local development, you can generate self-signed certificates:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Production

For production, use certificates from a trusted CA like:
- Let's Encrypt (free)
- CloudFlare
- Your hosting provider

## Environment Variables

Set `ENABLE_HTTPS=true` in your `.env` file to enable HTTPS server.