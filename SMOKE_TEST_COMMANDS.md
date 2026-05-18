# Smoke Test Commands

## Backend

```bash
cd backend
npm install
npm run dev
```

Expected:

```text
SS Healthcare backend → http://localhost:3001
API ready: /health, /api/system/health, /api/callyzer/health
```

## Health checks

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/callyzer/health
curl http://localhost:3001/api/system/health
```

## Insert test call through webhook

```bash
curl -X POST http://localhost:3001/api/callyzer/webhook \
  -H "Content-Type: application/json" \
  -H "x-callyzer-secret: change-this-secret" \
  --data @samples/callyzer-webhook-sample.json
```

## Frontend

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/call-review
```
