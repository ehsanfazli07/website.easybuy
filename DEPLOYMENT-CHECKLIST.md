# EasyBuy Deployment Checklist

This runbook is for a full production deployment with real payment and real admin access.

## 1) Required Access (Share if you want me to execute remotely)

- Server SSH host, port, username
- SSH private key or password
- Domain and DNS panel access
- PayPal merchant credentials
- Stripe secret key (if card flow is needed)

## 2) Required Environment Variables

Create `.env` from `.env.example` and fill all required values:

- `DATABASE_URL`
- `NEXTAUTH_URL` (must be your real domain)
- `NEXTAUTH_SECRET`
- `ADMIN_EMAIL=info@easybuystores.com`
- `PAYPAL_ENV=live`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_RECEIVER_EMAIL`
- `NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID`
- `NEXT_PUBLIC_PAYPAL_HOSTED_ACTION=https://www.paypal.com/cgi-bin/webscr`
- `STRIPE_SECRET_KEY` (optional if card is enabled)

## 3) Install and Build

Run on server:

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run build
```

## 4) Set Admin Account Password

PowerShell:

```powershell
$env:ADMIN_EMAIL="info@easybuystores.com"
$env:ADMIN_PASSWORD="IngilEhsan@13/06/2025"
node scripts/set-admin-password.mjs
```

Expected output:

`ADMIN_READY:info@easybuystores.com`

## 5) Start in Production

Direct:

```bash
npm run start
```

Recommended with PM2:

```bash
npm i -g pm2
pm2 start npm --name easybuy -- start
pm2 save
pm2 status
```

## 6) Nginx Reverse Proxy

Use your domain and proxy to app on port 3000:

```nginx
server {
  listen 80;
  server_name yourdomain.com www.yourdomain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Then enable SSL:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 7) Admin Panel Configuration

Login using:

- Email: `info@easybuystores.com`
- Password: the one you set with script

In Admin Panel, set:

- PayPal receiver email
- PayPal hosted button id
- PayPal hosted action URL
- Website and social links

## 8) Final Functional Test

1. Register a normal user
2. Login
3. Open Pricing
4. Click `Pay with PayPal / Card`
5. Confirm redirect to PayPal
6. Return to site
7. Confirm admin notification and audit logs exist

## 9) Troubleshooting

If payment does not redirect:

- Check hosted button id in Admin Panel
- Check `NEXTAUTH_URL` is real domain
- Check browser console and server logs

If admin panel is blocked:

- Confirm login email is exactly `info@easybuystores.com`
- Re-run admin password script

If app fails after reboot:

- Check PM2 process state
- Check `pm2 logs easybuy`
- Restart with `pm2 restart easybuy`
