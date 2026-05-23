# Credex AI Spend Audit

A free AI spend audit tool for startup teams to benchmark tool spend, identify plan downgrades, and surface potential credit savings. It generates a shareable audit summary and captures leads after value is shown.

## Screenshots
- TODO: Add screenshot 1 (form)
- TODO: Add screenshot 2 (audit results)
- TODO: Add screenshot 3 (shareable audit)

## Quick start
```bash
npm install
npm run dev
```

## Deploy
- TODO: Add deployment steps (Vercel/Netlify/etc.)
- Deployed URL: TODO

## Decisions (trade-offs)
1. Tool pricing is modeled as plan-level seats and usage, not token-level usage, to keep the input form simple.
2. Audit recommendations choose a single top action per tool to avoid overwhelming users in the first pass.
3. Shareable audits store only public-safe data (no email/company), trading off rich personalization for safety.
4. Lead capture email is sent after persistence, so a temporary email outage does not block form submission.
5. A lightweight honeypot + email cooldown is used instead of heavier CAPTCHA to reduce friction.
