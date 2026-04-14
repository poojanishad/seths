import express   from 'express'
import cors      from 'cors'
import dotenv    from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

if (!process.env.GROQ_API_KEY) {
  console.error('\n❌  GROQ_API_KEY not found in backend/.env\n')
  process.exit(1)
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

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

/* ── AI ─────────────────────────────────────────────────────────── */
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
    const data  = await upstream.json()
    return res.json({ reply: data.choices[0].message.content })
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/* ── Demo booking ───────────────────────────────────────────────── */
app.post('/api/book-demo', async (req, res) => {
  const { name, email, phone, org, students, time, confirmationMsg } = req.body

  if (!name || !email || !org || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const icsContent = buildICS({ name, email, org, slot: time })

  const userMailOptions = {
    from: `"EduERP Pro" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `✅ Demo Confirmed – EduERP Pro | ${time}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;padding:30px;border-radius:10px;border:1px solid #e5e7eb">

        <h1 style="text-align:center;color:#1f3b8f;margin-bottom:5px">EduERP Pro</h1>
        <p style="text-align:center;color:#4b7be5;font-size:13px;margin-top:0">
          India's Leading Education ERP
        </p>

        <h2 style="color:#1f3b8f;margin-top:25px">
          🎉 Demo Booked, ${name}!
        </h2>

        <p style="color:#333;line-height:1.7">
          Dear ${name}, I would like to warmly welcome ${org} to EduERP Pro and thank you for choosing us.
          We're thrilled to have you on board and excited to demonstrate how our ERP can streamline your operations.
          Your demo is scheduled for tomorrow between 10 AM and 12 PM IST.
        </p>

        <div style="background:#eef4ff;border-left:4px solid #4b7be5;padding:16px;border-radius:6px;margin:20px 0">
          <p style="margin:5px 0"><strong>📅 Slot:</strong> ${time}</p>
          <p style="margin:5px 0"><strong>🏫 Institution:</strong> ${org}</p>
          <p style="margin:5px 0"><strong>👥 Students:</strong> ${students || 'N/A'}</p>
          <p style="margin:5px 0"><strong>📞 Phone:</strong> ${phone || 'Not provided'}</p>
        </div>

        <p style="color:#555;font-size:13px">
          A calendar invite is attached. Please accept it to add the demo to your calendar.
        </p>

      </div>
    `,
    attachments: [{
      filename: 'EduERP-Demo.ics',
      content: icsContent,
      contentType: 'text/calendar; method=REQUEST',
    }],
  }

  const adminMailOptions = {
    from: `"EduERP Pro Bot" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `📋 New Demo Booking – ${org} | ${time}`,
    html: `New booking from ${name}`,
  }

  try {
    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions),
    ])
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send email', detail: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`)
})