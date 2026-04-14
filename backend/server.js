import express   from 'express'
import cors      from 'cors'
import dotenv    from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001;

if (!process.env.GROQ_API_KEY) {
  console.error('\n❌  GROQ_API_KEY not found in backend/.env\n')
  process.exit(1)
}


const cors = require("cors");

app.use(cors({
  origin: [
    "https://eduerppro.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

/* ── Nodemailer transporter (Gmail) ─────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/* ── Build .ics calendar file string ────────────────────────────── */
function buildICS({ name, email, org, slot }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dtStart = formatICSDate(tomorrow)
  const dtEnd   = formatICSDate(new Date(tomorrow.getTime() + 30 * 60 * 1000))
  const uid     = `demo-${Date.now()}@eduexperp.com`
  const now     = formatICSDate(new Date())

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduERP Pro//Demo Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:EduERP Pro Demo – ${org}`,
    `DESCRIPTION:Your personalised EduERP Pro demo.\\nSlot requested: ${slot}\\nContact: ${email}`,
    `ORGANIZER;CN=EduERP Pro Sales:mailto:${process.env.SMTP_USER}`,
    `ATTENDEE;CN=${name};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${email}`,
    `ATTENDEE;CN=Admin;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${process.env.ADMIN_EMAIL}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:EduERP Demo starting in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/* ── health ─────────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

/* ── AI confirmation message proxy ─────────────────────────────── */
app.post('/api/claude', async (req, res) => {
  const { prompt } = req.body
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      'llama-3.1-8b-instant',
        max_tokens: 1024,
        messages:   [{ role: 'user', content: prompt.trim() }],
      }),
    })
    if (!upstream.ok) {
      const err = await upstream.text()
      console.error('Groq error', upstream.status, err)
      return res.status(502).json({ error: 'Upstream error', status: upstream.status })
    }
    const data  = await upstream.json()
    const reply = data.choices[0].message.content
    return res.json({ reply })
  } catch (err) {
    console.error('Server error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/* ── Demo booking: send email + calendar invite ─────────────────── */
app.post('/api/book-demo', async (req, res) => {
  const { name, email, phone, org, students, time, confirmationMsg } = req.body

  if (!name || !email || !org || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const icsContent = buildICS({ name, email, org, slot: time })

  const userMailOptions = {
    from:    `"EduERP Pro" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: `✅ Demo Confirmed – EduERP Pro | ${time}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:32px;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#0f2b5b;font-size:24px;margin:0">EduERP Pro</h1>
          <p style="color:#4b7be5;margin:4px 0;font-size:13px">India's Leading Education ERP</p>
        </div>
        <h2 style="color:#0f2b5b">🎉 Demo Booked, ${name}!</h2>
        <p style="color:#333;line-height:1.7">${confirmationMsg || `We're excited to show you EduERP Pro. Your demo is scheduled for <strong>${time}</strong>.`}</p>
        <div style="background:#e8f0fe;border-left:4px solid #4b7be5;padding:16px;border-radius:6px;margin:20px 0">
          <p style="margin:0;color:#0f2b5b;font-size:14px"><strong>📅 Slot:</strong> ${time}</p>
          <p style="margin:6px 0 0;color:#0f2b5b;font-size:14px"><strong>🏫 Institution:</strong> ${org}</p>
          <p style="margin:6px 0 0;color:#0f2b5b;font-size:14px"><strong>👥 Students:</strong> ${students || 'Not specified'}</p>
          <p style="margin:6px 0 0;color:#0f2b5b;font-size:14px"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
        </div>
        <p style="color:#555;font-size:13px">A calendar invite is attached. Please accept it to add the demo to your calendar.</p>
        <p style="color:#555;font-size:13px">Need to reschedule? Reply to this email or WhatsApp us.</p>
        <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #ddd">
          <p style="color:#999;font-size:12px">© 2025 EduERP Pro · sales@eduexperp.com</p>
        </div>
      </div>
    `,
    attachments: [{
      filename:    'EduERP-Demo.ics',
      content:     icsContent,
      contentType: 'text/calendar; method=REQUEST',
    }],
  }

  const adminMailOptions = {
    from:    `"EduERP Pro Bot" <${process.env.SMTP_USER}>`,
    to:      process.env.ADMIN_EMAIL,
    subject: `📋 New Demo Booking – ${org} | ${time}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
        <h2 style="color:#0f2b5b;margin-top:0">🔔 New Demo Request</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px;color:#555;width:140px"><strong>Name</strong></td><td style="padding:8px;color:#222">${name}</td></tr>
          <tr style="background:#f5f7ff"><td style="padding:8px;color:#555"><strong>Email</strong></td><td style="padding:8px;color:#222">${email}</td></tr>
          <tr><td style="padding:8px;color:#555"><strong>Phone</strong></td><td style="padding:8px;color:#222">${phone || '—'}</td></tr>
          <tr style="background:#f5f7ff"><td style="padding:8px;color:#555"><strong>Institution</strong></td><td style="padding:8px;color:#222">${org}</td></tr>
          <tr><td style="padding:8px;color:#555"><strong>Students</strong></td><td style="padding:8px;color:#222">${students || '—'}</td></tr>
          <tr style="background:#f5f7ff"><td style="padding:8px;color:#555"><strong>Slot</strong></td><td style="padding:8px;color:#222;font-weight:bold">${time}</td></tr>
        </table>
        <p style="color:#888;font-size:12px;margin-top:20px">Calendar invite attached — accept to block the slot.</p>
      </div>
    `,
    attachments: [{
      filename:    'EduERP-Demo.ics',
      content:     icsContent,
      contentType: 'text/calendar; method=REQUEST',
    }],
  }

  try {
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions),
    ])
    console.log(`✅  Demo emails sent → user: ${email} | admin: ${process.env.ADMIN_EMAIL}`)
    return res.json({ success: true })
  } catch (err) {
    console.error('Email error:', err.message)
    return res.status(500).json({ error: 'Failed to send email', detail: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`\n✅  Backend running → http://localhost:${PORT}`)
  console.log(`   Groq API key : ${process.env.GROQ_API_KEY.slice(0, 14)}…`)
  console.log(`   SMTP user    : ${process.env.SMTP_USER}`)
  console.log(`   Admin email  : ${process.env.ADMIN_EMAIL}\n`)
})