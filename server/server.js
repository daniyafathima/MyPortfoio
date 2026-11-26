require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const { GMAIL_USER, GMAIL_APP_PASSWORD, ALLOWED_ORIGINS = '', PORT = 3000 } = process.env;
const TO_EMAIL = process.env.TO_EMAIL || GMAIL_USER;
const ROOT = path.join(__dirname, '..');

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
transporter.verify()
  .then(() => console.log('Mail login OK. Messages will be delivered to', TO_EMAIL))
  .catch(e => console.error('Mail login FAILED:', e.message));

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));

const origins = ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);
const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use('/api', cors({ origin: (o, cb) => cb(null, !o || origins.includes(o) || localOrigin.test(o)) }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'Too many messages sent. Please try again in a few minutes.' }
});
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/contact', limiter, async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: bots only
  const name = clean(b.name, 100), email = clean(b.email, 150);
  const subject = clean(b.subject, 150).replace(/[\r\n]+/g, ' '), message = clean(b.message, 5000);
  if (!name || !email || !subject || !message) return res.status(400).json({ ok: false, error: 'Please fill in all fields.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${GMAIL_USER}>`,
      to: TO_EMAIL,
      replyTo: `"${name.replace(/["\r\n]/g, '')}" <${email}>`,
      subject: `Portfolio message: ${subject}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      html: `<p><b>From:</b> ${esc(name)} &lt;${esc(email)}&gt;</p><p><b>Subject:</b> ${esc(subject)}</p><p style="white-space:pre-wrap">${esc(message)}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('sendMail failed:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send your message right now. Please email daniya28fathima@gmail.com directly.' });
  }
});

// Serve the portfolio itself (only public folders; never the server/ folder)
['css', 'js', 'assets'].forEach(d => app.use('/' + d, express.static(path.join(ROOT, d))));
app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
