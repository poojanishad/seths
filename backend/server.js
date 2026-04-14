import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY missing')
  process.exit(1)
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

/* ── ICS ───────────────────────────────────────── */
function buildICS({ name, email, org, slot }) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dtStart = formatICSDate(tomorrow)
  const dtEnd = formatICSDate(new Date(tomorrow.getTime() + 30 * 60 * 1000))

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Demo – ${org}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/* ── BREVO SEND ───────────────────────────────── */
async function sendEmail({ to, subject, html, ics }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'EduERP Pro',
        email: process.env.SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      attachment: [{
        name: 'demo.ics',
        content: Buffer.from(ics).toString('base64'),
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
}

/* ── BOOK DEMO ───────────────────────────────── */
app.post('/api/book-demo', async (req, res) => {
  const { name, email, phone, org, students, time } = req.body

  const ics = buildICS({ name, email, org, slot: time })

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;padding:30px;border-radius:10px;border:1px solid #e5e7eb">

    <h1 style="text-align:center;color:#1f3b8f;margin-bottom:5px">EduERP Pro</h1>
    <p style="text-align:center;color:#4b7be5;font-size:13px;margin-top:0">
      India's Leading Education ERP
    </p>

    <h2 style="color:#1f3b8f;margin-top:25px">
      🎉 Demo Booked, ${name}!
    </h2>

    <p style="color:#333;line-height:1.7">
      Dear ${name}, your demo has been successfully scheduled.
    </p>

    <div style="background:#eef4ff;border-left:4px solid #4b7be5;padding:16px;border-radius:6px;margin:20px 0">
      <p><strong>📅 Slot:</strong> ${time}</p>
      <p><strong>🏫 Institution:</strong> ${org}</p>
      <p><strong>👥 Students:</strong> ${students || 'N/A'}</p>
      <p><strong>📞 Phone:</strong> ${phone || 'N/A'}</p>
    </div>

    <p style="font-size:13px">
      A calendar invite is attached.
    </p>

  </div>
  `

  try {
    await sendEmail({
      to: email,
      subject: `Demo Confirmed`,
      html,
      ics,
    })

    return res.json({ success: true })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Email failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`)
})