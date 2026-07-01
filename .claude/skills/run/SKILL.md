---
description: Launch the gh-viewer Next.js dev server and screenshot the home page
---

# Run: gh-viewer

## Start the dev server

```bash
cd C:/Users/aleksa.ristic/source/gh-viewer
pkill -f "next dev" 2>/dev/null || true
npm run dev &
echo $! > /tmp/ghviewer-dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Port: **3000**

## Stop

```bash
kill $(cat /tmp/ghviewer-dev.pid) 2>/dev/null || pkill -f "next dev"
```

## Report

Tell the user the app is running at **http://localhost:3000**.
