import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

/* ── ENV CHECK ───────────────────────────────────────────── */
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY missing')
  process.exit(1)
}

/* ── MIDDLEWARE ─────────────────────────────────────────── */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running 🚀')
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

/* ── ICS BUILDER ────────────────────────────────────────── */
function buildICS({ name, email, org, slot }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dtStart = formatICSDate(tomorrow)
  const dtEnd = formatICSDate(new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000))
  const uid = `demo-${Date.now()}@eduexperp.com`
  const now = formatICSDate(new Date())

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
    `DESCRIPTION:Slot: ${slot}\\nContact: ${email}`,
    `ORGANIZER:mailto:${process.env.SENDER_EMAIL}`,
    `ATTENDEE:mailto:${email}`,
    `ATTENDEE:mailto:${process.env.ADMIN_EMAIL}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/* ── GROQ API ───────────────────────────────────────────── */
app.post('/api/claude', async (req, res) => {
  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'prompt required' })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    return res.json({ reply: data.choices[0].message.content })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'AI error' })
  }
})

/* ── BREVO EMAIL FUNCTION (FIXED) ───────────────────────── */
async function sendEmail({ to, subject, html, icsContent }) {
  const attachments = icsContent
    ? [{
        name: 'EduERP-Demo.ics',
        content: Buffer.from(icsContent).toString('base64'),
      }]
    : []

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: 'EduERP Pro',
          email: process.env.SENDER_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(attachments.length && { attachment: attachments }),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('❌ Brevo API Error:', err)
      throw new Error(`Brevo error ${res.status}`)
    }

    return res.json()

  } catch (err) {
    console.error('❌ Email sending failed:', err.message)
    throw err
  }
}

/* ── BOOK DEMO ─────────────────────────────────────────── */
app.post('/api/book-demo', async (req, res) => {
  const { name, email, org, time } = req.body

  if (!name || !email || !org || !time) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    const ics = buildICS({ name, email, org, slot: time })

    await Promise.all([
      sendEmail({
        to: email,
        subject: `✅ Demo Confirmed – ${time}`,
        html: `<h2>Hi ${name}, your demo is booked!</h2><p>Time: ${time}</p>`,
        icsContent: ics,
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `📋 New Booking – ${org}`,
        html: `<p>${name} booked demo at ${time}</p>`,
        icsContent: ics,
      }),
    ])

    return res.json({ success: true })

  } catch (err) {
    console.error('FULL ERROR:', err)
    return res.status(500).json({
      success: false,
      error: 'Failed to send email',
      detail: err.message,
    })
  }
})

/* ── START SERVER ───────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
})