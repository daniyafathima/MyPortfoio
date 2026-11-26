# Daniya Fathima – Developer Portfolio

Pure HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step.

```
portfolio/
├── index.html
├── css/style.css
├── js/script.js
├── assets/ (images/, icons/, resume.pdf)
└── README.md
```

## Run locally (with the contact backend)
The contact form needs the small Node server in `server/` (Node 18+).

1. Create a Google App Password: Google Account → Security → turn on **2-Step Verification**, then search **App passwords**, create one named "Portfolio" and copy the 16 characters.
2. In a terminal:
   ```
   cd server
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   ```
3. Open `server/.env` and paste the app password into `GMAIL_APP_PASSWORD`.
4. Start it: `npm start`. The terminal should print **Mail login OK**.
5. Open **http://localhost:3000**. The server serves the portfolio and the form together.
   (Live Server on port 5500 also works while the server is running.)
6. Send a test message and check daniya28fathima@gmail.com. If you see **Mail login FAILED**, the app password or 2-Step Verification is the problem.

`.env` is git-ignored. Never commit it or share the app password.

## Deploy (free): one Render service for site + form
GitHub Pages cannot run the backend, so host everything on Render:

1. Push the whole `portfolio` folder to a GitHub repo.
2. On render.com: **New → Web Service**, pick the repo, Runtime **Node**, Free plan.
3. Build command: `cd server && npm install`  Start command: `node server/server.js`
4. Under **Environment**, add `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `TO_EMAIL`.
5. Deploy. Your site is live at `https://<name>.onrender.com` and the form works on the same domain (no CORS setup).
6. Free services sleep when idle, so the first message after a quiet period can take up to a minute.

Alternative: keep the site on GitHub Pages and deploy only the backend to Render (root directory `server`). Then set `ALLOWED_ORIGINS=https://daniyafathima.github.io` on Render and put the service URL into `PROD_API` in `js/script.js`.
