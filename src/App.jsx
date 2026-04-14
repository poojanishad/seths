import { useState, useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════ */
const MODULES = [
  { id:1, icon:'🎓', title:'Student Information System', color:'#00d4ff', desc:'Complete student lifecycle management from enrollment to alumni tracking.', features:['Enrollment Management','Academic Records','Parent Portal','Alumni Network'] },
  { id:2, icon:'📚', title:'Learning Management',        color:'#f0b429', desc:'Deliver, track and assess learning with powerful digital tools.',             features:['Course Builder','Live Classes','Assessment Engine','Progress Analytics'] },
  { id:3, icon:'💰', title:'Finance & Accounting',       color:'#00ff88', desc:'Automate fee collection, scholarships, payroll and full accounting.',          features:['Fee Management','Scholarship Module','Payroll','GST Compliance'] },
  { id:4, icon:'🏛️', title:'Campus Management',          color:'#a78bfa', desc:'Manage facilities, assets, transport and hostel operations seamlessly.',       features:['Facility Booking','Asset Tracking','Transport GPS','Hostel Management'] },
  { id:5, icon:'📊', title:'Analytics & Reports',        color:'#fb7185', desc:'Real-time dashboards and predictive insights for smarter decisions.',          features:['Custom Dashboards','Predictive Analytics','Compliance Reports','KPI Tracking'] },
  { id:6, icon:'🤝', title:'HR & Staff Portal',          color:'#34d399', desc:'Complete human resource management for academic and non-academic staff.',      features:['Recruitment','Leave Management','Performance Reviews','Training Tracker'] },
]

const STATS = [
  { val:1200, suffix:'+', label:'Institutions' },
  { val:4.2,  suffix:'M', label:'Students Served' },
  { val:99.9, suffix:'%', label:'Uptime SLA' },
  { val:40,   suffix:'%', label:'Admin Time Saved' },
]

const TESTIMONIALS = [
  { name:'Dr. Priya Sharma', role:'Principal, DPS Lucknow',        avatar:'PS', text:'EduERP transformed our school\'s operations. Fee collection alone saves us 15 hours a week. The parent portal has been a game changer for communication.' },
  { name:'Prof. Arun Mehta',  role:'Registrar, IIT Kanpur',         avatar:'AM', text:'The analytics module gives us insights we never had before. We can predict student dropout risk and intervene early. Outstanding platform.' },
  { name:'Ms. Kavya Nair',    role:'CEO, Bright Future Schools',     avatar:'KN', text:'Managing 12 campuses from a single dashboard is now effortless. The ROI was visible within 3 months of deployment.' },
]

const PLANS = [
  { name:'Starter',    price:12,   per:'per student / year', features:['Up to 500 students','SIS + Attendance','Basic Analytics','Email Support','2 Admin Users'],                                           cta:'Start Free Trial' },
  { name:'Growth',     price:29,   per:'per student / year', features:['Up to 5,000 students','All Core Modules','Advanced Analytics','Priority Support','Unlimited Admins','Custom Branding'], featured:true, cta:'Get Started' },
  { name:'Enterprise', price:null, per:'Custom pricing',      features:['Unlimited students','All Modules + API','White-label Solution','Dedicated CSM','On-premise option','SLA Guarantee'],                cta:'Contact Sales' },
]

const STEPS = [
  { n:'01', icon:'🚀', title:'Onboard in Days',  desc:'Our implementation team migrates your data and configures the system to match your institution\'s workflows.' },
  { n:'02', icon:'🎯', title:'Train Your Team',  desc:'Live training sessions, video library and dedicated support get your staff productive from day one.' },
  { n:'03', icon:'⚡', title:'Go Live',           desc:'Launch with confidence. Our team stays on standby for 30 days post-go-live to ensure smooth operations.' },
  { n:'04', icon:'📈', title:'Scale & Grow',      desc:'Add modules, campuses and users as your institution grows. The platform scales with you effortlessly.' },
]

const INTEGRATIONS = ['Google Workspace','Microsoft 365','Zoom','Razorpay','PayTM','Tally ERP','WhatsApp API','Digilocker','NSDC','AICTE Portal','Slack','AWS']
const TICKER       = ['📚 LMS','💰 Finance','🎓 Admissions','📊 Analytics','🤝 HR','🏛️ Campus','📱 Mobile App','🔒 Secure','☁️ Cloud','🌐 API']

const FOOTER_LINKS = {
  Product:  [
    { label:'Features',     href:'#features' },
    { label:'Modules',      href:'#modules' },
    { label:'Pricing',      href:'#pricing' },
    { label:'Security',     modal:'security' },
    { label:'Integrations', href:'#integrations' },
    { label:'Changelog',    modal:'changelog' },
  ],
  Company:  [
    { label:'About Us',  modal:'about' },
    { label:'Blog',      modal:'blog' },
    { label:'Careers',   modal:'careers' },
    { label:'Press',     modal:'press' },
    { label:'Partners',  modal:'partners' },
  ],
  Support: [
    { label:'Documentation', modal:'docs' },
    { label:'API Reference', modal:'api' },
    { label:'System Status', modal:'status' },
    { label:'Contact',       href:'#contact' },
    { label:'Community',     modal:'community' },
  ],
  Legal: [
    { label:'Privacy Policy',    modal:'privacy' },
    { label:'Terms of Service',  modal:'terms' },
    { label:'Cookie Policy',     modal:'cookies' },
    { label:'GDPR',              modal:'gdpr' },
  ],
}

/* ═══════════════════════════════════════════════
   VALIDATION HELPERS
═══════════════════════════════════════════════ */
const validators = {
  name:     v => v.trim().length >= 2   ? '' : 'Full name must be at least 2 characters',
  email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address',
  phone:    v => /^[6-9]\d{9}$/.test(v.replace(/\s/g,'')) ? '' : 'Enter a valid 10-digit Indian mobile number',
  org:      v => v.trim().length >= 2   ? '' : 'Institution name is required',
  students: v => v ? '' : 'Please select a student range',
  time:     v => v ? '' : 'Please select a preferred time',
  msg:      v => v.trim().length >= 10  ? '' : 'Message must be at least 10 characters',
  type:     v => v ? '' : 'Please select an institution type',
}

function validate(fields, rules) {
  const errs = {}
  for (const [k, fn] of Object.entries(rules)) {
    const msg = fn(fields[k] || '')
    if (msg) errs[k] = msg
  }
  return errs
}
const API_URL = import.meta.env.VITE_API_URL;

/* ═══════════════════════════════════════════════
   CLAUDE API CALL  — proxied via /backend/server.js
   (API key stays on the server, never in the browser)
═══════════════════════════════════════════════ */
async function callClaude(prompt) {
  const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/claude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error('API error');

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return data.reply;
}

/* ═══════════════════════════════════════════════
   SHARED FORM PRIMITIVES
═══════════════════════════════════════════════ */
const inputBase = {
  width: '100%',
  background: 'rgba(0,212,255,.04)',
  border: '1px solid rgba(0,212,255,.15)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#e8f0fe',
  fontSize: 14,
  fontFamily: "'Space Grotesk',sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
}

const errStyle = { color: '#fb7185', fontSize: 11, marginTop: 4 }

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: error ? 6 : 14 }}>
      {label && <label style={{ fontSize: 12, color: '#7a8fb8', display: 'block', marginBottom: 6 }}>{label}</label>}
      {children}
      {error && <div style={errStyle}>⚠ {error}</div>}
      {error && <div style={{ marginBottom: 8 }} />}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 18 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(0,212,255,.15)',
        borderTop: '3px solid #00d4ff',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#7a8fb8', fontSize: 14 }}>Processing your request…</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════ */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) e.target.classList.add('revealed') }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ═══════════════════════════════════════════════
   ANIMATED NUMBER
═══════════════════════════════════════════════ */
function AnimatedNumber({ target, suffix }) {
  const [cur, setCur] = useState(0)
  const ref = useRef(null)
  const done = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true
        let v = 0, steps = 60, inc = target / steps
        const t = setInterval(() => { v += inc; if (v >= target) { setCur(target); clearInterval(t) } else setCur(v) }, 30)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{target < 10 ? cur.toFixed(1) : Math.round(cur)}{suffix}</span>
}

/* ═══════════════════════════════════════════════
   MODAL SYSTEM
═══════════════════════════════════════════════ */
const MODAL_CONTENT = {
  demo:    { title: '📅 Book Your Free Demo',    body: () => <DemoForm /> },
  video:   { title: '▶ Product Demo Video',      body: () => <VideoDemo /> },
  trial:   { title: '🚀 Start Your Free Trial',  body: () => <TrialForm /> },
  contact: { title: '📞 Contact Our Sales Team', body: () => <ContactForm /> },
  roi:     { title: '📊 Your ROI Report',        body: () => <ROIReport /> },
  security: {
    title: '🔒 Enterprise Security',
    body: () => (
      <div style={{ color:'#b0c4de', lineHeight:1.8 }}>
        <p style={{ marginBottom:16 }}>EduERP Pro is built with security-first architecture:</p>
        {['SOC 2 Type II Certified','ISO 27001 Compliant','256-bit AES Encryption at rest','TLS 1.3 in transit','Role-Based Access Control (RBAC)','Two-Factor Authentication (2FA)','Daily automated backups with 99-day retention','Penetration tested quarterly by independent auditors','GDPR & DPDP Act compliant','Zero-knowledge architecture for sensitive data'].map(i => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}><span style={{ color:'#00d4ff' }}>✓</span>{i}</div>
        ))}
      </div>
    ),
  },
  about: {
    title: '🏢 About EduERP Pro',
    body: () => (
      <div style={{ color:'#b0c4de', lineHeight:1.8 }}>
        <p style={{ marginBottom:16 }}>Founded in 2015, EduERP Pro is India's leading education technology company headquartered in Bengaluru, Karnataka.</p>
        <p style={{ marginBottom:16 }}>We serve 1,200+ institutions across India, from single-campus schools to multi-state university systems with 100,000+ students.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, margin:'24px 0' }}>
          {[['2015','Founded'],['1200+','Institutions'],['4.2M+','Students'],['350+','Team Members']].map(([v,l]) => (
            <div key={l} style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.1)', borderRadius:12, padding:'16px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:'#00d4ff', fontWeight:700 }}>{v}</div>
              <div style={{ fontSize:13, color:'#7a8fb8', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
        <p>Our mission: make world-class institutional management accessible to every school in India.</p>
      </div>
    ),
  },
  careers: {
    title: '💼 Join Our Team',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        <p style={{ lineHeight:1.7, marginBottom:20 }}>We're a 350-person team building the future of education technology in India. Open roles:</p>
        {[['Senior React Developer','Bengaluru / Remote','Engineering'],['Product Manager – SIS','Bengaluru','Product'],['Customer Success Manager','Mumbai / Remote','Customer Success'],['Sales Executive – EdTech','Delhi NCR','Sales'],['UI/UX Designer','Remote','Design']].map(([role,loc,dept]) => (
          <div key={role} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 20px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:'#e8f0fe' }}>{role}</div>
              <div style={{ fontSize:12, color:'#7a8fb8', marginTop:3 }}>{dept} · {loc}</div>
            </div>
            <button style={{ background:'linear-gradient(135deg,#00d4ff,#0099cc)', color:'#060d1f', border:'none', padding:'6px 16px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>Apply</button>
          </div>
        ))}
      </div>
    ),
  },
  docs: {
    title: '📖 Documentation',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        <p style={{ marginBottom:20, lineHeight:1.7 }}>Comprehensive documentation to get you started quickly:</p>
        {[['Getting Started Guide','Setup your first institution in 30 minutes'],['API Reference','REST API with Postman collection'],['Integration Guides','Connect Google Workspace, Zoom, Razorpay'],['Video Tutorials','Step-by-step walkthroughs for every module'],['Release Notes','See what\'s new in every version'],['Community Forum','Ask questions, share tips']].map(([title, desc]) => (
          <div key={title} style={{ display:'flex', gap:12, marginBottom:16, padding:'14px 16px', background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)', borderRadius:10 }}>
            <span style={{ color:'#00d4ff', fontSize:16, flexShrink:0 }}>→</span>
            <div><div style={{ fontWeight:600, fontSize:14, color:'#e8f0fe', marginBottom:3 }}>{title}</div><div style={{ fontSize:13, color:'#7a8fb8' }}>{desc}</div></div>
          </div>
        ))}
      </div>
    ),
  },
  status: {
    title: '🟢 System Status',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(52,211,153,.1)', border:'1px solid rgba(52,211,153,.2)', borderRadius:10, padding:'12px 16px', marginBottom:24 }}>
          <span style={{ color:'#34d399', fontSize:18 }}>●</span>
          <span style={{ color:'#34d399', fontWeight:600 }}>All Systems Operational</span>
        </div>
        {[['Core Platform','Operational','#34d399'],['Student Portal','Operational','#34d399'],['Parent Mobile App','Operational','#34d399'],['Fee Payment Gateway','Operational','#34d399'],['Video Classes (LMS)','Operational','#34d399'],['API Endpoints','Operational','#34d399'],['SMS / WhatsApp Alerts','Operational','#34d399']].map(([s,st,c]) => (
          <div key={s} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(0,212,255,.06)' }}>
            <span style={{ fontSize:14 }}>{s}</span>
            <span style={{ fontSize:13, color:c, fontWeight:600 }}>{st}</span>
          </div>
        ))}
        <div style={{ marginTop:16, fontSize:12, color:'#7a8fb8' }}>Last checked: just now · 99.98% uptime last 90 days</div>
      </div>
    ),
  },
  privacy:  { title:'🔏 Privacy Policy',   body: () => <LegalDoc points={['We collect only the data necessary to provide our services.','Student and staff data is never sold to third parties.','You may request data deletion at any time.','We use cookies for authentication and analytics only.','Data is stored in ISO 27001 certified data centers in India.','We comply with GDPR (EU) and DPDP Act 2023 (India).']} /> },
  terms:    { title:'📋 Terms of Service', body: () => <LegalDoc points={['EduERP Pro grants you a non-exclusive, non-transferable license.','You are responsible for maintaining account credentials.','You may not use the platform for unlawful purposes.','We may terminate accounts that violate our acceptable use policy.','Service availability is governed by the SLA in your contract.','These terms are governed by the laws of India.']} /> },
  cookies:  { title:'🍪 Cookie Policy',    body: () => <LegalDoc points={['We use strictly necessary cookies for authentication.','Analytics cookies help us improve user experience.','You may disable non-essential cookies in settings.','Third-party cookies (Razorpay, Google) are used for payments/maps.','Cookie consent is required on first visit.','Cookie data is retained for a maximum of 1 year.']} /> },
  gdpr:     { title:'🇪🇺 GDPR Compliance', body: () => <LegalDoc points={['EduERP Pro is fully GDPR compliant for EU institutions.','We act as a Data Processor on behalf of your institution.','Data Processing Agreements (DPAs) available on request.','EU customer data remains in EU-region data centers.','Right to access, rectify, and erase data is supported.','Our DPO can be contacted at dpo@eduexperp.com.']} /> },
  api: {
    title: '🔗 API Reference',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        <p style={{ marginBottom:16, lineHeight:1.7 }}>RESTful API with comprehensive coverage of all platform modules.</p>
        <div style={{ background:'#040a18', borderRadius:10, padding:'16px', fontFamily:"'DM Mono',monospace", fontSize:13, color:'#00d4ff', marginBottom:20, overflowX:'auto' }}>
          <div style={{ color:'#7a8fb8', marginBottom:8 }}>// Base URL</div>
          <div>https://api.eduexperp.com/v2</div>
          <div style={{ color:'#7a8fb8', margin:'12px 0 8px' }}>// Authentication</div>
          <div>Authorization: Bearer {'<your-api-key>'}</div>
          <div style={{ color:'#7a8fb8', margin:'12px 0 8px' }}>// Example: Get Students</div>
          <div>GET /institutions/:id/students</div>
        </div>
        {['Students API','Attendance API','Fee & Payments API','Courses & LMS API','Reports & Analytics API','Webhooks & Events'].map(a => (
          <div key={a} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(0,212,255,.06)', fontSize:14 }}>
            <span>{a}</span><span style={{ color:'#34d399', fontSize:12 }}>Documented</span>
          </div>
        ))}
      </div>
    ),
  },
  blog: {
    title: '✍️ Blog & Insights',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        {[['How AI is Transforming Attendance Management','March 2025','Analytics'],['CBSE Compliance Checklist for 2025-26','February 2025','Compliance'],['5 Ways to Reduce Fee Collection Time by 80%','January 2025','Finance'],['Building a Paperless Admission Process','December 2024','Admissions'],['EduERP Pro 4.2 — What\'s New','November 2024','Product']].map(([title,date,tag]) => (
          <div key={title} style={{ padding:'16px 0', borderBottom:'1px solid rgba(0,212,255,.06)' }}>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <span style={{ background:'rgba(0,212,255,.1)', color:'#00d4ff', fontSize:11, padding:'2px 8px', borderRadius:20, fontFamily:"'DM Mono',monospace" }}>{tag}</span>
              <span style={{ color:'#7a8fb8', fontSize:12 }}>{date}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:'#e8f0fe', cursor:'pointer' }}
              onMouseEnter={e=>e.target.style.color='#00d4ff'} onMouseLeave={e=>e.target.style.color='#e8f0fe'}>{title}</div>
          </div>
        ))}
      </div>
    ),
  },
  press:     { title:'📰 Press & Media',   body: () => <LegalDoc points={['EduERP Pro featured in Economic Times — "Top EdTech Platforms 2024"','Awarded "Best Education ERP" by IAMAI 2024','Featured on YourStory: "Scaling India\'s Education Infrastructure"','Coverage in Inc42, The Hindu BusinessLine, and Mint','Press kit and media assets available on request: press@eduexperp.com']} /> },
  partners:  { title:'🤝 Partner Program', body: () => <LegalDoc points={['Implementation Partners — Certified system integrators','Reseller Program — 20–30% recurring commission','Technology Partners — API-first integrations','Academic Partners — University collaborations','Apply at partners@eduexperp.com']} /> },
  community: { title:'💬 Community',       body: () => <LegalDoc points={['Join 8,000+ EduERP administrators on our community forum','Monthly webinars with product experts','Annual EduERP Summit — next edition: Bengaluru, September 2025','Regional user groups across 15 Indian cities','Slack workspace for real-time peer support']} /> },
  changelog: {
    title:'📝 Changelog',
    body: () => (
      <div style={{ color:'#b0c4de' }}>
        {[['v4.2.0','March 2025','AI-powered attendance prediction, WhatsApp integration 2.0, new fee receipts engine'],['v4.1.0','January 2025','Biometric integration, multi-currency support, CUET exam module'],['v4.0.0','October 2024','Complete UI redesign, mobile apps v3, real-time analytics dashboard'],['v3.8.0','July 2024','ONDC integration, NEP 2020 compliance updates, bulk data import']].map(([v,d,n]) => (
          <div key={v} style={{ padding:'16px 0', borderBottom:'1px solid rgba(0,212,255,.06)' }}>
            <div style={{ display:'flex', gap:8, marginBottom:6, alignItems:'center' }}>
              <span style={{ background:'rgba(0,212,255,.1)', color:'#00d4ff', fontSize:12, padding:'2px 10px', borderRadius:20, fontFamily:"'DM Mono',monospace", fontWeight:600 }}>{v}</span>
              <span style={{ color:'#7a8fb8', fontSize:12 }}>{d}</span>
            </div>
            <p style={{ fontSize:14, lineHeight:1.6 }}>{n}</p>
          </div>
        ))}
      </div>
    ),
  },
}

function LegalDoc({ points }) {
  return (
    <div style={{ color:'#b0c4de' }}>
      <p style={{ marginBottom:20, color:'#7a8fb8', fontSize:13 }}>Last updated: March 2025</p>
      {points.map((p, i) => (
        <div key={i} style={{ display:'flex', gap:12, marginBottom:14, lineHeight:1.7 }}>
          <span style={{ color:'#00d4ff', flexShrink:0 }}>{i+1}.</span><span>{p}</span>
        </div>
      ))}
      <p style={{ marginTop:20, fontSize:13, color:'#7a8fb8' }}>For the full document, contact legal@eduexperp.com</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DEMO BOOKING FORM  (production)
═══════════════════════════════════════════════ */
function DemoForm() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', org:'', students:'', time:'' })
  const [errs, setErrs] = useState({})
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [apiErr, setApiErr] = useState('')

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrs(e => ({ ...e, [k]: '' })) }

  const RULES = {
    name: validators.name, email: validators.email,
    phone: validators.phone, org: validators.org,
    students: validators.students, time: validators.time,
  }

  const handleSubmit = async () => {
    const e = validate(form, RULES)
    if (Object.keys(e).length) { setErrs(e); return }
    setLoading(true); setApiErr('')
    try {
      // 1. Generate AI confirmation message
      const msg = await callClaude(
        `You are a friendly sales rep at EduERP Pro, India's leading Education ERP. A school administrator just booked a demo. Write a warm, professional, personalized confirmation note (4–5 sentences) for:
Name: ${form.name}
Email: ${form.email}
Institution: ${form.org}
Students: ${form.students}
Preferred slot: ${form.time}

Mention their specific slot, reference their institution size, and express genuine excitement. End with what they can expect in the demo. No subject line, no sign-off — just the body paragraph.`
      )
      // 2. Send real emails + .ics calendar invite to user & admin
      await fetch(`${API_URL.replace(/\/$/, '')}/api/book-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          org: form.org, students: form.students, time: form.time,
          confirmationMsg: msg,
        }),
      }).catch(err => console.error('Email send failed:', err))

      setConfirm({ name: form.name, email: form.email, msg })
    } catch {
      setApiErr('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  if (confirm) return (
    <div style={{ textAlign:'center', padding:'24px 0' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:12 }}>Demo Booked!</h3>
      <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.15)', borderRadius:14, padding:'20px 24px', marginBottom:16, textAlign:'left' }}>
        <p style={{ color:'#b0c4de', lineHeight:1.8, fontSize:14 }}>{confirm.msg}</p>
      </div>
      <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.15)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#34d399' }}>
        📧 A calendar invite is on its way to <strong>{confirm.email}</strong>
      </div>
    </div>
  )

  const sel = { ...inputBase, background:'#0d1c3a', border:'1px solid rgba(0,212,255,.15)' }

  return (
    <div>
      <p style={{ color:'#7a8fb8', marginBottom:20, lineHeight:1.6 }}>See EduERP Pro in action — personalized to your institution type. Free, no-obligation 30-minute session.</p>

      {apiErr && <div style={{ background:'rgba(251,113,133,.08)', border:'1px solid rgba(251,113,133,.2)', borderRadius:8, padding:'10px 14px', color:'#fb7185', fontSize:13, marginBottom:16 }}>⚠ {apiErr}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {[['name','Full Name','text'],['email','Email Address','email'],['phone','Phone Number','tel'],['org','Institution Name','text']].map(([k,l,t]) => (
          <Field key={k} label={`${l} *`} error={errs[k]}>
            <input type={t} value={form[k]} onChange={set(k)} placeholder={l}
              style={{ ...inputBase, borderColor: errs[k] ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        <Field label="Number of Students *" error={errs.students}>
          <select value={form.students} onChange={set('students')} style={{ ...sel, borderColor: errs.students ? '#fb7185' : 'rgba(0,212,255,.15)' }}>
            <option value=''>Select range</option>
            {['< 500','500 – 2,000','2,000 – 10,000','10,000 – 50,000','50,000+'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Preferred Time *" error={errs.time}>
          <select value={form.time} onChange={set('time')} style={{ ...sel, borderColor: errs.time ? '#fb7185' : 'rgba(0,212,255,.15)' }}>
            <option value=''>Select slot</option>
            {['Today 2–4 PM','Tomorrow 10–12 AM','Tomorrow 3–5 PM','This Week – Flexible','Next Week – Flexible'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </div>

      <button className='grad-btn' onClick={handleSubmit} style={{ width:'100%', padding:'14px', borderRadius:10, fontSize:15 }}>
        📅 Confirm My Free Demo
      </button>
      <p style={{ textAlign:'center', marginTop:10, color:'#7a8fb8', fontSize:12 }}>No credit card · No obligation · Response within 2 hours</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   VIDEO DEMO
═══════════════════════════════════════════════ */
function VideoDemo() {
  return (
    <div>
      <div style={{ background:'#040a18', borderRadius:14, overflow:'hidden', position:'relative', paddingBottom:'56.25%', marginBottom:20 }}>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,rgba(0,212,255,.08),rgba(240,180,41,.06))', border:'1px solid rgba(0,212,255,.1)' }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#00d4ff,#0099cc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, cursor:'pointer', marginBottom:16 }}>▶</div>
          <div style={{ color:'#e8f0fe', fontWeight:600, fontSize:16 }}>EduERP Pro — Full Platform Tour</div>
          <div style={{ color:'#7a8fb8', fontSize:13, marginTop:6 }}>12 minutes · Covers all 6 modules</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[['00:00','Platform Overview'],['02:15','Student Management'],['04:30','Finance & Fees'],['06:45','LMS & Classes'],['09:00','Analytics'],['10:40','Mobile App']].map(([t,l]) => (
          <div key={l} style={{ background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)', borderRadius:8, padding:'10px 12px', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,212,255,.4)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(0,212,255,.1)'}>
            <div style={{ color:'#00d4ff', fontSize:11, fontFamily:"'DM Mono',monospace", marginBottom:3 }}>{t}</div>
            <div style={{ color:'#b0c4de', fontSize:12 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   TRIAL FORM  (production)
═══════════════════════════════════════════════ */
function TrialForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name:'', email:'', phone:'', org:'', type:'' })
  const [errs, setErrs] = useState({})
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [apiErr, setApiErr] = useState('')

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrs(e => ({ ...e, [k]: '' })) }
  const setType = v => { setForm(f => ({ ...f, type: v })); setErrs(e => ({ ...e, type: '' })) }

  const validateStep1 = () => {
    const e = validate(form, { name: validators.name, email: validators.email, phone: validators.phone })
    setErrs(e)
    return !Object.keys(e).length
  }

  const validateStep2 = () => {
    const e = validate(form, { org: validators.org, type: validators.type })
    setErrs(e)
    return !Object.keys(e).length
  }

  const handleStep1 = () => { if (validateStep1()) setStep(2) }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    setLoading(true); setApiErr('')
    try {
      const msg = await callClaude(
        `You are an onboarding specialist at EduERP Pro. A new institution just signed up for a 14-day free trial. Write a warm, exciting welcome message (4–5 sentences) for:
Name: ${form.name}
Institution: ${form.org}
Type: ${form.type}
Email: ${form.email}

Tell them their trial is ready, mention 2–3 specific modules that would be most useful for their institution type, and give one practical first step to get started. Enthusiastic but professional tone.`
      )
      setConfirm({ name: form.name, email: form.email, org: form.org, msg })
    } catch {
      setApiErr('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  if (confirm) return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>🚀</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:8 }}>Trial Account Created!</h3>
      <p style={{ color:'#7a8fb8', fontSize:13, marginBottom:20 }}>{confirm.org}</p>
      <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.15)', borderRadius:14, padding:'20px 24px', marginBottom:16, textAlign:'left' }}>
        <p style={{ color:'#b0c4de', lineHeight:1.8, fontSize:14 }}>{confirm.msg}</p>
      </div>
      <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.15)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#34d399', marginBottom:16 }}>
        📧 Login credentials sent to <strong>{confirm.email}</strong>
      </div>
      <button className='grad-btn' style={{ padding:'12px 32px', borderRadius:10, fontSize:15 }}>Open EduERP Dashboard →</button>
    </div>
  )

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {[1,2].map(s => (
          <div key={s} style={{ flex:1, height:4, borderRadius:4, background: s<=step ? 'linear-gradient(135deg,#00d4ff,#0099cc)' : 'rgba(0,212,255,.15)', transition:'background .3s' }} />
        ))}
      </div>

      {apiErr && <div style={{ background:'rgba(251,113,133,.08)', border:'1px solid rgba(251,113,133,.2)', borderRadius:8, padding:'10px 14px', color:'#fb7185', fontSize:13, marginBottom:16 }}>⚠ {apiErr}</div>}

      {step === 1 && (
        <>
          <p style={{ color:'#7a8fb8', marginBottom:20 }}>Create your free 14-day trial. No credit card required.</p>
          <Field label="Your Name *" error={errs.name}>
            <input type='text' value={form.name} onChange={set('name')} placeholder='Full Name'
              style={{ ...inputBase, borderColor: errs.name ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <Field label="Work Email *" error={errs.email}>
            <input type='email' value={form.email} onChange={set('email')} placeholder='you@institution.edu'
              style={{ ...inputBase, borderColor: errs.email ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <Field label="Phone (WhatsApp preferred) *" error={errs.phone}>
            <input type='tel' value={form.phone} onChange={set('phone')} placeholder='10-digit mobile number'
              style={{ ...inputBase, borderColor: errs.phone ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <button className='grad-btn' onClick={handleStep1} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, marginTop:4 }}>Continue →</button>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ color:'#7a8fb8', marginBottom:20 }}>Tell us about your institution so we can pre-configure your trial.</p>
          <Field label="Institution Name *" error={errs.org}>
            <input type='text' value={form.org} onChange={set('org')} placeholder='e.g. Delhi Public School, Kanpur'
              style={{ ...inputBase, borderColor: errs.org ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <div style={{ marginBottom: errs.type ? 6 : 20 }}>
            <label style={{ fontSize:12, color:'#7a8fb8', display:'block', marginBottom:10 }}>Institution Type *</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {['School (K-12)','College / Degree','University','Coaching / Training','Ed-Tech Platform','Other'].map(t => (
                <div key={t} onClick={() => setType(t)}
                  style={{ padding:'10px 14px', border:`1px solid ${form.type===t?'#00d4ff': errs.type ? '#fb7185' :'rgba(0,212,255,.15)'}`, borderRadius:8, cursor:'pointer', fontSize:13, color: form.type===t?'#00d4ff':'#7a8fb8', background: form.type===t?'rgba(0,212,255,.08)':'transparent', transition:'all .2s' }}>
                  {t}
                </div>
              ))}
            </div>
            {errs.type && <div style={{ ...errStyle, marginTop:6 }}>⚠ {errs.type}</div>}
          </div>
          <div style={{ display:'flex', gap:10, marginTop: errs.type ? 14 : 0 }}>
            <button onClick={() => { setStep(1); setErrs({}) }} style={{ flex:1, padding:'13px', borderRadius:10, fontSize:14, background:'transparent', border:'1px solid rgba(0,212,255,.2)', color:'#7a8fb8', cursor:'pointer' }}>← Back</button>
            <button className='grad-btn' onClick={handleSubmit} style={{ flex:2, padding:'13px', borderRadius:10, fontSize:15 }}>Start Free Trial 🚀</button>
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   CONTACT FORM  (production)
═══════════════════════════════════════════════ */
function ContactForm() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', org:'', msg:'' })
  const [errs, setErrs] = useState({})
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [apiErr, setApiErr] = useState('')

  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setErrs(e => ({ ...e, [k]: '' })) }

  const RULES = {
    name: validators.name, email: validators.email,
    phone: validators.phone, org: validators.org, msg: validators.msg,
  }

  const handleSubmit = async () => {
    const e = validate(form, RULES)
    if (Object.keys(e).length) { setErrs(e); return }
    setLoading(true); setApiErr('')
    try {
      const reply = await callClaude(
        `You are a senior sales consultant at EduERP Pro. A prospective client just sent an inquiry. Write a warm, professional auto-reply (4–6 sentences) that:
1. Acknowledges their specific message content
2. Gives 1–2 relevant points about how EduERP Pro addresses their needs
3. Commits to a specific follow-up timeline (within 4 business hours for sales inquiries)

Client details:
Name: ${form.name}
Institution: ${form.org}
Email: ${form.email}
Message: ${form.msg}

Reply as if writing directly to them. No subject line, no greeting, no sign-off — just the body.`
      )
      setConfirm({ name: form.name, email: form.email, reply })
    } catch {
      setApiErr('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  if (confirm) return (
    <div style={{ textAlign:'center', padding:'20px 0' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, marginBottom:12 }}>Message Received!</h3>
      <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.15)', borderRadius:14, padding:'20px 24px', marginBottom:16, textAlign:'left' }}>
        <div style={{ fontSize:11, color:'#00d4ff', fontFamily:"'DM Mono',monospace", marginBottom:10 }}>AUTO-REPLY FROM SALES TEAM</div>
        <p style={{ color:'#b0c4de', lineHeight:1.8, fontSize:14 }}>{confirm.reply}</p>
      </div>
      <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.15)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'#34d399' }}>
        📧 Full response sent to <strong>{confirm.email}</strong>
      </div>
    </div>
  )

  return (
    <div>
      {/* Quick contact options */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        {[['📞','1800-XXX-XXXX','Toll Free'],['📧','sales@eduexperp.com','Email'],['💬','WhatsApp Us','Quick Reply']].map(([ic,v,l]) => (
          <div key={l} style={{ flex:1, background:'rgba(0,212,255,.04)', border:'1px solid rgba(0,212,255,.1)', borderRadius:10, padding:'12px', textAlign:'center', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#00d4ff'} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(0,212,255,.1)'}>
            <div style={{ fontSize:20, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:12, color:'#00d4ff', fontWeight:600 }}>{v}</div>
            <div style={{ fontSize:11, color:'#7a8fb8' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop:'1px solid rgba(0,212,255,.08)', paddingTop:16 }}>
        {apiErr && <div style={{ background:'rgba(251,113,133,.08)', border:'1px solid rgba(251,113,133,.2)', borderRadius:8, padding:'10px 14px', color:'#fb7185', fontSize:13, marginBottom:14 }}>⚠ {apiErr}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <Field label="Full Name *" error={errs.name}>
            <input type='text' value={form.name} onChange={set('name')} placeholder='Full Name'
              style={{ ...inputBase, borderColor: errs.name ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <Field label="Email *" error={errs.email}>
            <input type='email' value={form.email} onChange={set('email')} placeholder='Email'
              style={{ ...inputBase, borderColor: errs.email ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <Field label="Phone *" error={errs.phone}>
            <input type='tel' value={form.phone} onChange={set('phone')} placeholder='10-digit mobile'
              style={{ ...inputBase, borderColor: errs.phone ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
          <Field label="Institution *" error={errs.org}>
            <input type='text' value={form.org} onChange={set('org')} placeholder='Institution Name'
              style={{ ...inputBase, borderColor: errs.org ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
          </Field>
        </div>

        <Field label="Your Message *" error={errs.msg}>
          <textarea value={form.msg} onChange={set('msg')} placeholder='Tell us about your requirements…' rows={3}
            style={{ ...inputBase, resize:'vertical', borderColor: errs.msg ? '#fb7185' : 'rgba(0,212,255,.15)' }} />
        </Field>

        <button className='grad-btn' onClick={handleSubmit} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15 }}>
          Send Message →
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   ROI REPORT
═══════════════════════════════════════════════ */
function ROIReport() {
  return (
    <div style={{ color:'#b0c4de' }}>
      <p style={{ marginBottom:20, color:'#7a8fb8', lineHeight:1.6 }}>Based on aggregated data from 1,200+ institutions on EduERP Pro:</p>
      {[['Admin hours saved / month','120 hrs','per 500 students'],['Fee collection time','↓ 80%','vs manual process'],['Defaulters detected early','3× faster','via automated alerts'],['Parent communication time','↓ 65%','via automated notices'],['Report generation','↓ 95%','from days to seconds'],['Staff onboarding time','↓ 50%','with digital workflows'],['Annual cost savings','₹8.4L avg','per 500-student school']].map(([m,v,n]) => (
        <div key={m} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(0,212,255,.06)' }}>
          <span style={{ fontSize:14 }}>{m}</span>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#00d4ff', fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{v}</div>
            <div style={{ fontSize:11, color:'#7a8fb8' }}>{n}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop:20, background:'rgba(240,180,41,.06)', border:'1px solid rgba(240,180,41,.15)', borderRadius:12, padding:'16px', textAlign:'center' }}>
        <div style={{ color:'#f0b429', fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700 }}>Average ROI: 6.2×</div>
        <div style={{ color:'#7a8fb8', fontSize:13, marginTop:4 }}>within first 12 months of deployment</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════ */
function Modal({ id, onClose }) {
  const content = MODAL_CONTENT[id]
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])
  if (!content) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(6,13,31,.85)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'var(--navy2)', border:'1px solid rgba(0,212,255,.2)', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', animation:'slideUp .3s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid rgba(0,212,255,.1)', position:'sticky', top:0, background:'var(--navy2)', zIndex:1 }}>
          <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:600 }}>{content.title}</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'#7a8fb8', width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ padding:'24px' }}>
          <content.body />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════ */
function Nav({ openModal }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }) }
  return (
    <nav className='nav-glass' style={{ position:'fixed', top:0, left:0, right:0, zIndex:1000, padding:'0 2rem', transition:'all .3s' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height: scrolled ? 56 : 68, transition:'height .3s' }}>
        <button onClick={() => scrollTo('home')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#00d4ff,#f0b429)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#e8f0fe' }}>EduERP <span style={{ color:'#00d4ff' }}>Pro</span></span>
        </button>
        <div className='desktop-nav' style={{ display:'flex', gap:32, alignItems:'center' }}>
          {[['Features','features'],['Modules','modules'],['Pricing','pricing'],['Contact','contact']].map(([l,id]) => (
            <button key={l} onClick={() => scrollTo(id)}
              style={{ background:'none', border:'none', color:'#7a8fb8', fontSize:14, fontWeight:500, cursor:'pointer', transition:'color .2s', fontFamily:"'Space Grotesk',sans-serif", padding:0 }}
              onMouseEnter={e=>e.target.style.color='#00d4ff'} onMouseLeave={e=>e.target.style.color='#7a8fb8'}>{l}</button>
          ))}
          <button className='grad-btn' onClick={() => openModal('demo')} style={{ padding:'8px 20px', borderRadius:8, fontSize:14 }}>Request Demo</button>
        </div>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════ */
function Hero({ openModal }) {
  const [wIdx, setWIdx] = useState(0)
  const words = ['Schools','Colleges','Universities','Academies']
  useEffect(() => { const t = setInterval(() => setWIdx(i => (i+1)%words.length), 2200); return () => clearInterval(t) }, [])
  return (
    <section id='home' className='hero-grid' style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingTop:80 }}>
      <div className='orb' style={{ width:600, height:600, background:'rgba(0,212,255,.06)', top:-200, left:-200 }} />
      <div className='orb' style={{ width:400, height:400, background:'rgba(240,180,41,.06)', bottom:-100, right:-100 }} />
      <div style={{ position:'absolute', top:'18%', right:'6%', animation:'float 6s ease-in-out infinite' }}>
        <div style={{ width:200, height:200, borderRadius:'50%', border:'1px solid rgba(0,212,255,.2)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}><div style={{ fontSize:36 }}>📊</div><div className='mono' style={{ fontSize:11, color:'#00d4ff', marginTop:4 }}>LIVE DATA</div></div>
          {[0,1,2].map(i => (
            <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:10, height:10, borderRadius:'50%', background:['#00d4ff','#f0b429','#00ff88'][i], animation:`orbit ${4+i}s linear infinite`, animationDelay:`${i*1.2}s`, boxShadow:`0 0 8px ${['#00d4ff','#f0b429','#00ff88'][i]}` }} />
          ))}
        </div>
      </div>
      <div style={{ position:'absolute', bottom:'22%', right:'5%', background:'rgba(13,28,58,.9)', border:'1px solid rgba(0,212,255,.2)', borderRadius:12, padding:'12px 18px', animation:'float 5s 1s ease-in-out infinite' }}>
        <div className='mono' style={{ color:'#00d4ff', fontSize:11 }}>FEE COLLECTED TODAY</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#f0b429' }}>₹14.2L</div>
      </div>
      <div style={{ position:'absolute', top:'60%', right:'18%', background:'rgba(13,28,58,.9)', border:'1px solid rgba(52,211,153,.2)', borderRadius:12, padding:'12px 18px', animation:'float 4s 2s ease-in-out infinite' }}>
        <div className='mono' style={{ color:'#34d399', fontSize:11 }}>ATTENDANCE RATE</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#34d399' }}>96.4%</div>
      </div>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 2rem', position:'relative', zIndex:2 }}>
        <div style={{ maxWidth:680 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, animation:'slideUp .8s ease both' }}>
            <span className='tag'>✦ India's #1 Education ERP</span>
            <span className='gold-tag'>Trusted by 1200+ Institutions</span>
          </div>
          <h1 style={{ fontSize:'clamp(2.4rem,5.5vw,4.2rem)', lineHeight:1.1, marginBottom:20, animation:'slideUp .8s .1s ease both', opacity:0, animationFillMode:'forwards' }}>
            The Complete ERP<br />for Modern&nbsp;
            <span className='grad-text' key={wIdx} style={{ display:'inline-block', animation:'slideUp .4s ease both' }}>{words[wIdx]}</span>
          </h1>
          <p style={{ fontSize:18, color:'#7a8fb8', lineHeight:1.8, marginBottom:36, maxWidth:560, animation:'slideUp .8s .2s ease both', opacity:0, animationFillMode:'forwards' }}>
            Unify admissions, academics, finance, HR, and analytics in one powerful platform — purpose-built for the future of education.
          </p>
          <div className='hero-cta' style={{ display:'flex', gap:16, flexWrap:'wrap', animation:'slideUp .8s .3s ease both', opacity:0, animationFillMode:'forwards' }}>
            <button className='grad-btn' onClick={() => openModal('trial')} style={{ padding:'14px 32px', borderRadius:10, fontSize:16 }}>Start Free Trial →</button>
            <button className='outline-btn' onClick={() => openModal('video')} style={{ padding:'14px 32px', borderRadius:10, fontSize:16, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:32, height:32, borderRadius:'50%', background:'rgba(0,212,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>▶</span>
              Watch Demo
            </button>
          </div>
          <div style={{ display:'flex', gap:28, marginTop:36, flexWrap:'wrap', animation:'slideUp .8s .4s ease both', opacity:0, animationFillMode:'forwards' }}>
            {['No credit card required','14-day free trial','GDPR & Data compliant'].map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#7a8fb8' }}>
                <span style={{ color:'#00d4ff' }}>✓</span> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='scroll-track' style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,212,255,.04)', borderTop:'1px solid rgba(0,212,255,.08)', padding:'12px 0' }}>
        <div className='scroll-inner'>
          {[...TICKER,...TICKER].map((t,i) => <span key={i} className='mono' style={{ color:'#7a8fb8', fontSize:13, marginRight:48 }}>{t}</span>)}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */
function Stats() {
  const ref = useReveal()
  return (
    <section style={{ padding:'80px 2rem', background:'var(--navy2)' }}>
      <div ref={ref} className='reveal' style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:24 }}>
        {STATS.map(s => (
          <div key={s.label} className='stat-card' style={{ borderRadius:16, padding:'32px 24px', textAlign:'center' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:700, lineHeight:1 }} className='grad-text'>
              <AnimatedNumber target={s.val} suffix={s.suffix} />
            </div>
            <div style={{ color:'#7a8fb8', marginTop:8, fontSize:14, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FEATURES
═══════════════════════════════════════════════ */
function Features({ openModal }) {
  const ref = useReveal()
  const items = [
    { icon:'☁️', title:'Cloud-Native',       desc:'Zero infrastructure. Auto-scaling. 99.9% uptime SLA backed by AWS.', modal:'status' },
    { icon:'📱', title:'Mobile First',        desc:'Native apps for iOS & Android. Offline mode for remote campuses.', modal:'demo' },
    { icon:'🔒', title:'Enterprise Security', desc:'SOC 2 certified. Role-based access. End-to-end encryption.',       modal:'security' },
    { icon:'🔗', title:'50+ Integrations',    desc:'Connect Google Workspace, Zoom, Razorpay, Tally and more.',         modal:null },
    { icon:'🌐', title:'Multi-Language',      desc:'Supports 12 Indian languages. Perfect for regional institutions.',   modal:null },
    { icon:'🤖', title:'AI-Powered',          desc:'Predictive analytics, automated grading, and smart attendance.',    modal:'roi' },
  ]
  return (
    <section id='features' style={{ padding:'100px 2rem' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:64 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>WHY CHOOSE US</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:16 }}>Built for <span className='grad-text'>Scale & Simplicity</span></h2>
          <p style={{ color:'#7a8fb8', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>Every feature is designed to reduce administrative burden and improve learning outcomes.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {items.map(it => (
            <div key={it.title}
              onClick={() => it.modal && openModal(it.modal)}
              style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:28, transition:'all .3s', cursor: it.modal?'pointer':'default' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='#00d4ff'; e.currentTarget.style.transform='translateY(-4px)' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none' }}>
              <div style={{ fontSize:32, marginBottom:16 }}>{it.icon}</div>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:17, marginBottom:10 }}>{it.title}</h3>
              <p style={{ color:'#7a8fb8', fontSize:14, lineHeight:1.7, marginBottom: it.modal?12:0 }}>{it.desc}</p>
              {it.modal && <span style={{ color:'#00d4ff', fontSize:13, fontWeight:500 }}>Learn more →</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   MODULES
═══════════════════════════════════════════════ */
function Modules({ openModal }) {
  const [active, setActive] = useState(1)
  const ref = useReveal()
  const mod = MODULES.find(m => m.id === active)
  return (
    <section id='modules' style={{ padding:'100px 2rem', background:'var(--navy2)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:64 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>PLATFORM MODULES</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:16 }}>Everything Your Institution <span className='grad-text'>Needs</span></h2>
          <p style={{ color:'#7a8fb8', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>Six integrated modules that cover every aspect of institutional management, connected in real-time.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24, marginBottom:32 }}>
          {MODULES.map(m => (
            <div key={m.id} className={`module-card ${active===m.id?'active':''}`} style={{ borderRadius:16, padding:28 }} onClick={() => setActive(m.id)}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                <div style={{ width:52, height:52, borderRadius:12, background:`${m.color}18`, border:`1px solid ${m.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{m.icon}</div>
                <div>
                  <h3 style={{ fontSize:15, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, marginBottom:6 }}>{m.title}</h3>
                  <p style={{ color:'#7a8fb8', fontSize:13, lineHeight:1.6 }}>{m.desc}</p>
                </div>
              </div>
              {active===m.id && (
                <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid rgba(0,212,255,.1)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                    {m.features.map(f => (
                      <div key={f} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#b0c4de' }}>
                        <span style={{ color:m.color, fontSize:9 }}>◆</span>{f}
                      </div>
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); openModal('demo') }}
                    style={{ background:`${m.color}18`, border:`1px solid ${m.color}40`, color:m.color, padding:'7px 16px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, transition:'all .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${m.color}30`} onMouseLeave={e=>e.currentTarget.style.background=`${m.color}18`}>
                    See Live Demo →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center' }}>
          <div className='mono' style={{ color:'#7a8fb8', fontSize:13 }}>Active module: <span style={{ color:mod.color }}>{mod.title}</span> — {mod.features.length} sub-modules</div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════ */
function HowItWorks({ openModal }) {
  const ref = useReveal()
  return (
    <section style={{ padding:'100px 2rem' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:64 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>HOW IT WORKS</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:16 }}>Up & Running in <span className='grad-text'>Under 2 Weeks</span></h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:28, position:'relative' }}>
          {STEPS.map((s,i) => (
            <div key={s.n} style={{ textAlign:'center', padding:'36px 24px', borderRadius:16, background:'var(--card)', border:'1px solid var(--border)', position:'relative' }}>
              <div className='mono' style={{ color:'rgba(0,212,255,.25)', fontSize:52, fontWeight:500, lineHeight:1, marginBottom:12 }}>{s.n}</div>
              <div style={{ fontSize:32, marginBottom:16 }}>{s.icon}</div>
              <h3 style={{ fontSize:17, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, marginBottom:10 }}>{s.title}</h3>
              <p style={{ color:'#7a8fb8', fontSize:14, lineHeight:1.7 }}>{s.desc}</p>
              {i < STEPS.length-1 && <div style={{ position:'absolute', top:'50%', right:-14, color:'rgba(0,212,255,.3)', fontSize:22 }}>→</div>}
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:40 }}>
          <button className='grad-btn' onClick={() => openModal('demo')} style={{ padding:'13px 36px', borderRadius:10, fontSize:15 }}>Start Implementation →</button>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   ROI CALCULATOR
═══════════════════════════════════════════════ */
function ROICalculator({ openModal }) {
  const [students, setStudents] = useState(500)
  const [staff, setStaff] = useState(50)
  const ref = useReveal()
  const adminHours = Math.round(students * 0.4 + staff * 2)
  const savings = Math.round(adminHours * 400)
  return (
    <section style={{ padding:'100px 2rem', background:'var(--navy2)' }}>
      <div style={{ maxWidth:820, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:48 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>ROI CALCULATOR</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:12 }}>Calculate Your <span className='grad-text'>Savings</span></h2>
          <p style={{ color:'#7a8fb8' }}>See how much time and money EduERP Pro can save your institution annually.</p>
        </div>
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'40px 36px' }}>
          <div className='roi-grid' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40, marginBottom:40 }}>
            <div>
              <label style={{ color:'#7a8fb8', fontSize:13, display:'block', marginBottom:12 }}>Number of Students</label>
              <input type='range' min='100' max='10000' step='100' value={students} onChange={e=>setStudents(+e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <div className='mono' style={{ color:'#00d4ff', fontSize:22, fontWeight:500 }}>{students.toLocaleString()}</div>
            </div>
            <div>
              <label style={{ color:'#7a8fb8', fontSize:13, display:'block', marginBottom:12 }}>Number of Staff</label>
              <input type='range' min='10' max='500' step='10' value={staff} onChange={e=>setStaff(+e.target.value)} style={{ width:'100%', marginBottom:8 }} />
              <div className='mono' style={{ color:'#f0b429', fontSize:22, fontWeight:500 }}>{staff}</div>
            </div>
          </div>
          <div className='result-grid' style={{ borderTop:'1px solid var(--border)', paddingTop:32, display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:28 }}>
            <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.15)', borderRadius:14, padding:28, textAlign:'center' }}>
              <div style={{ color:'#7a8fb8', fontSize:12, marginBottom:8 }}>HOURS SAVED / MONTH</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:44, color:'#00d4ff', fontWeight:700 }}>{adminHours.toLocaleString()}</div>
              <div style={{ color:'#7a8fb8', fontSize:12, marginTop:4 }}>admin hours automated</div>
            </div>
            <div style={{ background:'rgba(240,180,41,.06)', border:'1px solid rgba(240,180,41,.15)', borderRadius:14, padding:28, textAlign:'center' }}>
              <div style={{ color:'#7a8fb8', fontSize:12, marginBottom:8 }}>ANNUAL SAVINGS (₹)</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:44, color:'#f0b429', fontWeight:700 }}>₹{(savings/100000).toFixed(1)}L</div>
              <div style={{ color:'#7a8fb8', fontSize:12, marginTop:4 }}>estimated cost savings</div>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <button className='grad-btn' onClick={() => openModal('roi')} style={{ padding:'13px 36px', borderRadius:10, fontSize:15 }}>Get Full ROI Report →</button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   INTEGRATIONS
═══════════════════════════════════════════════ */
function Integrations({ openModal }) {
  const ref = useReveal()
  return (
    <section id='integrations' style={{ padding:'80px 2rem' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', textAlign:'center' }}>
        <div ref={ref} className='reveal'>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>INTEGRATIONS</span>
          <h2 style={{ fontSize:'clamp(1.8rem,3.5vw,2.6rem)', marginBottom:16 }}>Connects With Your <span className='grad-text'>Existing Tools</span></h2>
          <p style={{ color:'#7a8fb8', marginBottom:40 }}>50+ pre-built integrations. Plug in and go live instantly.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center' }}>
            {INTEGRATIONS.map(name => (
              <div key={name} onClick={() => openModal('docs')}
                style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:40, padding:'10px 20px', fontSize:14, color:'#b0c4de', transition:'all .2s', cursor:'pointer' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='#00d4ff'; e.currentTarget.style.color='#00d4ff' }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='#b0c4de' }}>
                {name}
              </div>
            ))}
          </div>
          <div style={{ marginTop:24 }}>
            <button className='outline-btn' onClick={() => openModal('docs')} style={{ padding:'10px 28px', borderRadius:8, fontSize:14 }}>View All 50+ Integrations</button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════ */
function Testimonials() {
  const [active, setActive] = useState(0)
  const ref = useReveal()
  return (
    <section style={{ padding:'100px 2rem', background:'var(--navy2)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:64 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>TESTIMONIALS</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)' }}>Loved by <span className='grad-text'>Educators</span></h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
          {TESTIMONIALS.map((t,i) => (
            <div key={i} className='testimonial-card' style={{ borderRadius:16, padding:28, cursor:'pointer', border: i===active?'1px solid rgba(0,212,255,.4)':'1px solid var(--border)' }} onClick={() => setActive(i)}>
              <div style={{ display:'flex', gap:3, marginBottom:16 }}>{'★★★★★'.split('').map((s,j) => <span key={j} style={{ color:'#f0b429', fontSize:16 }}>{s}</span>)}</div>
              <p style={{ color:'#b0c4de', lineHeight:1.7, fontSize:14, marginBottom:20, fontStyle:'italic' }}>&ldquo;{t.text}&rdquo;</p>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#00d4ff,#f0b429)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#060d1f', flexShrink:0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{t.name}</div>
                  <div style={{ color:'#7a8fb8', fontSize:12 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   PRICING
═══════════════════════════════════════════════ */
function Pricing({ openModal }) {
  const [annual, setAnnual] = useState(true)
  const ref = useReveal()
  return (
    <section id='pricing' style={{ padding:'100px 2rem' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div ref={ref} className='reveal' style={{ textAlign:'center', marginBottom:64 }}>
          <span className='tag' style={{ marginBottom:16, display:'inline-block' }}>PRICING</span>
          <h2 style={{ fontSize:'clamp(2rem,4vw,3rem)', marginBottom:20 }}>Simple, <span className='grad-text'>Transparent</span> Pricing</h2>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:40, padding:'6px 8px' }}>
            <button onClick={() => setAnnual(false)} style={{ padding:'6px 20px', borderRadius:30, border:'none', cursor:'pointer', background:!annual?'linear-gradient(135deg,#00d4ff,#0099cc)':'transparent', color:!annual?'#060d1f':'#7a8fb8', fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14 }}>Monthly</button>
            <button onClick={() => setAnnual(true)}  style={{ padding:'6px 20px', borderRadius:30, border:'none', cursor:'pointer', background:annual?'linear-gradient(135deg,#00d4ff,#0099cc)':'transparent',  color:annual?'#060d1f':'#7a8fb8',  fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:14 }}>Annual <span style={{ fontSize:11, color:annual?'#060d1f':'#f0b429' }}>&nbsp;SAVE 20%</span></button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {PLANS.map(p => (
            <div key={p.name} className={`price-card ${p.featured?'featured':''}`} style={{ borderRadius:20, padding:'36px 28px', position:'relative' }}>
              {p.featured && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#f0b429,#ffd166)', color:'#060d1f', fontSize:11, padding:'4px 18px', borderRadius:20, fontWeight:700, whiteSpace:'nowrap' }}>MOST POPULAR</div>}
              <h3 style={{ fontSize:20, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, marginBottom:8 }}>{p.name}</h3>
              <div style={{ marginBottom:28 }}>
                {p.price != null ? (
                  <>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:48, fontWeight:700, color:p.featured?'#f0b429':'#00d4ff' }}>₹{annual?Math.round(p.price*.8):p.price}</span>
                    <span style={{ color:'#7a8fb8', fontSize:13 }}> {p.per}</span>
                    {annual && <div className='mono' style={{ color:'#00ff88', fontSize:11, marginTop:4 }}>✓ 20% annual discount applied</div>}
                  </>
                ) : (
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:700, color:'#a78bfa' }}>Custom</div>
                )}
              </div>
              <ul style={{ listStyle:'none', marginBottom:32, display:'flex', flexDirection:'column', gap:12 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#b0c4de' }}>
                    <span style={{ color:p.featured?'#f0b429':'#00d4ff', fontSize:11, flexShrink:0 }}>◆</span>{f}
                  </li>
                ))}
              </ul>
              <button
                className={p.featured?'grad-btn':'outline-btn'}
                onClick={() => openModal(p.name==='Enterprise'?'contact':'trial')}
                style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15 }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:28 }}>
          <p style={{ color:'#7a8fb8', fontSize:14 }}>All plans include a 14-day free trial. No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   CTA
═══════════════════════════════════════════════ */
function CTA({ openModal }) {
  const ref = useReveal()
  return (
    <section id='contact' style={{ padding:'100px 2rem', background:'var(--navy2)' }}>
      <div ref={ref} className='reveal' style={{ maxWidth:740, margin:'0 auto', textAlign:'center' }}>
        <div style={{ background:'linear-gradient(135deg,rgba(0,212,255,.08),rgba(240,180,41,.08))', border:'1px solid rgba(0,212,255,.15)', borderRadius:24, padding:'64px 48px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(0,212,255,.04)', animation:'float 6s ease-in-out infinite' }} />
          <div className='gold-tag' style={{ display:'inline-block', marginBottom:20 }}>LIMITED TIME — 3 MONTHS FREE ONBOARDING</div>
          <h2 style={{ fontSize:'clamp(2rem,4vw,2.8rem)', marginBottom:16, lineHeight:1.2 }}>Ready to Digitize Your Institution?</h2>
          <p style={{ color:'#7a8fb8', lineHeight:1.7, marginBottom:36, fontSize:16 }}>Join 1,200+ institutions already running on EduERP Pro. Get a personalized demo configured for your specific needs.</p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <button className='grad-btn' onClick={() => openModal('demo')} style={{ padding:'14px 36px', borderRadius:10, fontSize:16 }}>Book Free Demo →</button>
            <button className='outline-btn' onClick={() => openModal('contact')} style={{ padding:'14px 36px', borderRadius:10, fontSize:16 }}>Contact Sales</button>
          </div>
          <div className='mono' style={{ color:'rgba(0,212,255,.4)', fontSize:11, marginTop:24 }}>No obligation · No credit card · Response within 24 hours</div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════ */
function Footer({ openModal }) {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' })
  const handleLink = ({ href, modal }) => {
    if (href) scrollTo(href.replace('#',''))
    else if (modal) openModal(modal)
  }
  return (
    <footer style={{ background:'#040a18', borderTop:'1px solid rgba(0,212,255,.08)', padding:'60px 2rem 28px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <div className='footer-grid' style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:40, marginBottom:52 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#00d4ff,#f0b429)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#e8f0fe' }}>EduERP <span style={{ color:'#00d4ff' }}>Pro</span></span>
            </div>
            <p style={{ color:'#7a8fb8', fontSize:14, lineHeight:1.7, maxWidth:260, marginBottom:20 }}>India's most trusted ERP platform for educational institutions. Built for the future of learning.</p>
            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              {[['𝕏','https://x.com'],['in','https://linkedin.com'],['▶','https://youtube.com'],['f','https://facebook.com']].map(([s,url]) => (
                <a key={s} href={url} target='_blank' rel='noopener noreferrer'
                  style={{ width:34, height:34, borderRadius:8, background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, cursor:'pointer', color:'#7a8fb8', textDecoration:'none', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.color='#00d4ff'; e.currentTarget.style.borderColor='rgba(0,212,255,.4)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.color='#7a8fb8'; e.currentTarget.style.borderColor='rgba(0,212,255,.12)' }}>
                  {s}
                </a>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => openModal('demo')} style={{ background:'rgba(0,212,255,.08)', border:'1px solid rgba(0,212,255,.2)', color:'#00d4ff', padding:'7px 14px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>📅 Book Demo</button>
              <button onClick={() => openModal('contact')} style={{ background:'transparent', border:'1px solid rgba(255,255,255,.1)', color:'#7a8fb8', padding:'7px 14px', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif" }}>📞 Call Us</button>
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([cat, items]) => (
            <div key={cat}>
              <div style={{ fontWeight:600, marginBottom:16, fontSize:13, color:'#e8f0fe' }}>{cat}</div>
              {items.map(item => (
                <button key={item.label} onClick={() => handleLink(item)}
                  style={{ display:'block', color:'#7a8fb8', fontSize:13, marginBottom:10, cursor:'pointer', background:'none', border:'none', textAlign:'left', padding:0, fontFamily:"'Space Grotesk',sans-serif", transition:'color .2s', width:'100%' }}
                  onMouseEnter={e=>e.target.style.color='#00d4ff'} onMouseLeave={e=>e.target.style.color='#7a8fb8'}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(0,212,255,.08)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div className='mono' style={{ color:'#7a8fb8', fontSize:12 }}>© 2025 EduERP Pro Pvt. Ltd. All rights reserved. Made with ❤️ in India</div>
          <div className='mono' style={{ color:'rgba(0,212,255,.3)', fontSize:12 }}>v4.2.0 · SOC 2 Certified · ISO 27001</div>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Space+Grotesk:wght@400;500;600;700&family=DM+Mono&display=swap');

  :root {
    --navy:  #060d1f;
    --navy2: #0a1628;
    --card:  #0d1c3a;
    --border: rgba(0,212,255,.12);
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: var(--navy);
    color: #e8f0fe;
    font-family: 'Space Grotesk', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  h1,h2,h3 { font-family: 'Playfair Display', serif; font-weight:700; }

  .mono { font-family: 'DM Mono', monospace; }

  .grad-text {
    background: linear-gradient(135deg, #00d4ff, #f0b429);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tag {
    background: rgba(0,212,255,.08);
    border: 1px solid rgba(0,212,255,.2);
    color: #00d4ff;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    letter-spacing: .08em;
    display: inline-block;
  }

  .gold-tag {
    background: rgba(240,180,41,.08);
    border: 1px solid rgba(240,180,41,.2);
    color: #f0b429;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    letter-spacing: .08em;
  }

  .grad-btn {
    background: linear-gradient(135deg, #00d4ff, #0099cc);
    color: #060d1f;
    border: none;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s;
    letter-spacing: .01em;
  }
  .grad-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,212,255,.3); filter: brightness(1.1); }
  .grad-btn:active { transform: translateY(0); }

  .outline-btn {
    background: transparent;
    border: 1px solid rgba(0,212,255,.3);
    color: #00d4ff;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all .2s;
  }
  .outline-btn:hover { background: rgba(0,212,255,.08); border-color: #00d4ff; }

  .nav-glass {
    background: rgba(6,13,31,.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0,212,255,.08);
  }

  .hero-grid { background: radial-gradient(ellipse at 20% 50%, rgba(0,212,255,.04) 0%, transparent 60%); }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .stat-card {
    background: rgba(0,212,255,.03);
    border: 1px solid rgba(0,212,255,.1);
    transition: all .3s;
  }
  .stat-card:hover { border-color: rgba(0,212,255,.3); transform: translateY(-4px); }

  .module-card {
    background: var(--card);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all .3s;
  }
  .module-card:hover, .module-card.active {
    border-color: #00d4ff;
    background: rgba(0,212,255,.04);
  }

  .testimonial-card {
    background: var(--card);
    transition: all .3s;
  }

  .price-card {
    background: var(--card);
    border: 1px solid var(--border);
    transition: all .3s;
  }
  .price-card:hover { transform: translateY(-4px); border-color: rgba(0,212,255,.3); }
  .price-card.featured {
    background: linear-gradient(160deg, rgba(240,180,41,.06), rgba(0,212,255,.04));
    border-color: rgba(240,180,41,.3);
  }
  .price-card.featured:hover { border-color: #f0b429; }

  .scroll-track { overflow: hidden; }
  .scroll-inner {
    display: flex;
    animation: ticker 30s linear infinite;
    white-space: nowrap;
    width: max-content;
  }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
  .revealed { opacity: 1; transform: none; }

  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
  @keyframes float   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
  @keyframes ticker  { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes orbit {
    from { transform: translate(-50%,-50%) rotate(0deg) translateX(90px) rotate(0deg); }
    to   { transform: translate(-50%,-50%) rotate(360deg) translateX(90px) rotate(-360deg); }
  }

  input[type=range] {
    -webkit-appearance: none;
    height: 4px;
    border-radius: 2px;
    background: rgba(0,212,255,.15);
    outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #00d4ff, #0099cc);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(0,212,255,.5);
  }

  input:focus, textarea:focus, select:focus {
    border-color: rgba(0,212,255,.5) !important;
    box-shadow: 0 0 0 3px rgba(0,212,255,.08);
  }

  @media (max-width:768px) {
    .desktop-nav { display:none !important; }
    .hero-cta    { flex-direction:column; }
    .footer-grid { grid-template-columns:1fr 1fr !important; }
    .roi-grid, .result-grid { grid-template-columns:1fr !important; }
  }
`

/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
export default function App() {
  const [modal, setModal] = useState(null)
  const openModal  = useCallback(id => setModal(id), [])
  const closeModal = useCallback(() => setModal(null), [])

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Nav openModal={openModal} />
      <main>
        <Hero openModal={openModal} />
        <Stats />
        <Features openModal={openModal} />
        <Modules openModal={openModal} />
        <HowItWorks openModal={openModal} />
        <ROICalculator openModal={openModal} />
        <Integrations openModal={openModal} />
        <Testimonials />
        <Pricing openModal={openModal} />
        <CTA openModal={openModal} />
      </main>
      <Footer openModal={openModal} />
      {modal && <Modal id={modal} onClose={closeModal} />}
    </>
  )
}
