import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

/* ── ENV CHECK ───────────────────────────────────────────── */
if (!process.env.BREVO_API_KEY) console.warn('⚠️ BREVO_API_KEY missing')
if (!process.env.SENDER_EMAIL) console.warn('⚠️ SENDER_EMAIL missing')
if (!process.env.ADMIN_EMAIL) console.warn('⚠️ ADMIN_EMAIL missing')

/* ── MIDDLEWARE ─────────────────────────────────────────── */
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is running 🚀')
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

/* ── BREVO EMAIL FUNCTION ───────────────────────────────── */
async function sendEmail({ to, subject, html, icsContent }) {
  const attachments = icsContent
    ? [{
        name: 'invite.ics',
        content: Buffer.from(icsContent).toString('base64'),
      }]
    : []

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
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

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brevo error ${response.status}: ${error}`)
  }

  return response.json()
}

/* ── BOOK DEMO ─────────────────────────────────────────── */
app.post('/api/book-demo', async (req, res) => {
  const { name, email, org, time } = req.body

  if (!name || !email || !org || !time) {
    return res.status(400).json({ error: 'Missing required fields' })
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
        subject: `📋 New Demo – ${org}`,
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