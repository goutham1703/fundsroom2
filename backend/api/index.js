import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const app = express()
const port = process.env.PORT || 4000
const jwtSecret = process.env.JWT_SECRET || 'northstar-demo-secret'
const adminSignupCode = process.env.ADMIN_SIGNUP_CODE || 'northstar-admin-2026'
const prisma = process.env.DATABASE_URL ? new PrismaClient() : null

app.use(cors({ origin: process.env.FRONTEND_URL || true }))
app.use(express.json())

const users = [
  { id: 1, email: 'admin@northstar.in', password: 'admin123', name: 'Arjun Kumar', role: 'ADMIN' },
  { id: 2, email: 'sales@northstar.in', password: 'sales123', name: 'Priya Shah', role: 'SALES_USER' },
]

const records = {
  enquiries: [
    { id: 'ENQ-2024-0148', customer: 'Mehta Retail Mart', date: '11 Sep 2024', value: 38400, status: 'New', detail: '3 products · Required 20 Sep' },
    { id: 'ENQ-2024-0147', customer: 'Shah Distributors', date: '10 Sep 2024', value: 92750, status: 'Quoted', detail: '8 products · Required 18 Sep' },
    { id: 'ENQ-2024-0146', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Won', detail: '4 products · Required 16 Sep' },
  ],
  quotations: [
    { id: 'QUO-2024-0091', customer: 'Shah Distributors', date: '10 Sep 2024', value: 92750, status: 'Sent', detail: 'Valid until 25 Sep 2024' },
    { id: 'QUO-2024-0090', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Accepted', detail: '4 products · Ready for order' },
  ],
  orders: [
    { id: 'SO-2024-0068', customer: 'Kapoor Wholesale', date: '09 Sep 2024', value: 21980, status: 'Pending', detail: 'Reserved 64 of 64 units' },
    { id: 'SO-2024-0067', customer: 'Mehta Retail Mart', date: '08 Sep 2024', value: 18420, status: 'Confirmed', detail: 'Dispatch due 14 Sep 2024' },
  ],
  dispatches: [
    { id: 'DSP-2024-0042', customer: 'Mehta Retail Mart', date: '11 Sep 2024', value: 18420, status: 'Ready', detail: 'Vehicle pending · 38 units' },
    { id: 'DSP-2024-0041', customer: 'Shah Distributors', date: '10 Sep 2024', value: 42750, status: 'Dispatched', detail: 'MH 12 AB 4401 · 120 units' },
  ],
}

const roles = { quotations: ['ADMIN', 'SALES_USER'], orders: ['ADMIN'], dispatches: ['ADMIN'], enquiries: ['ADMIN', 'SALES_USER'] }
const transitions = { enquiries: 'Quoted', quotations: 'Accepted', orders: 'Confirmed', dispatches: 'Dispatched' }

function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  try {
    request.user = jwt.verify(token, jwtSecret)
    next()
  } catch {
    response.status(401).json({ message: 'Authentication required' })
  }
}

function requireRole(resource, request, response, next) {
  if (!roles[resource]?.includes(request.user.role)) return response.status(403).json({ message: 'This role cannot perform that action' })
  next()
}

app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'northstar-erp-api' }))

app.post('/api/auth/login', async (request, response) => {
  try {
    const email = request.body.email?.toLowerCase()
    let user
    if (prisma) {
      const databaseUser = await prisma.user.findUnique({ where: { email } })
      if (databaseUser && databaseUser.isActive && await bcrypt.compare(request.body.password || '', databaseUser.passwordHash)) user = databaseUser
    } else {
      user = users.find((candidate) => candidate.email === email && candidate.password === request.body.password)
    }
    if (!user) return response.status(401).json({ message: 'Invalid email or password' })
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, jwtSecret, { expiresIn: '24h' })
    response.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    console.error('Login failed', error)
    response.status(500).json({ message: 'Unable to authenticate' })
  }
})

app.post('/api/auth/signup', async (request, response) => {
  try {
    const email = request.body.email?.trim().toLowerCase()
    const name = request.body.name?.trim()
    const password = request.body.password || ''
    const role = request.body.role === 'ADMIN' ? 'ADMIN' : 'SALES_USER'
    if (!name || !email || password.length < 8) return response.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required' })
    if (role === 'ADMIN' && request.body.adminCode !== adminSignupCode) return response.status(403).json({ message: 'A valid admin invite code is required' })
    if (prisma) {
      const user = await prisma.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 12), role } })
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, jwtSecret, { expiresIn: '24h' })
      return response.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
    }
    if (users.some((user) => user.email === email)) return response.status(409).json({ message: 'An account with this email already exists' })
    const user = { id: users.length + 1, email, password, name, role }
    users.push(user)
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, jwtSecret, { expiresIn: '24h' })
    response.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    if (error?.code === 'P2002') return response.status(409).json({ message: 'An account with this email already exists' })
    console.error('Signup failed', error)
    response.status(500).json({ message: 'Unable to create account' })
  }
})

app.get('/api/workflow/:resource', requireAuth, (request, response) => {
  const resource = request.params.resource
  if (!records[resource]) return response.status(404).json({ message: 'Workflow resource not found' })
  response.json(records[resource])
})

app.patch('/api/workflow/:resource/:id/advance', requireAuth, (request, response, next) => requireRole(request.params.resource, request, response, next), (request, response) => {
  const resource = request.params.resource
  const record = records[resource]?.find((candidate) => candidate.id === request.params.id)
  if (!record) return response.status(404).json({ message: 'Workflow record not found' })
  record.status = transitions[resource]
  response.json(record)
})

if (!process.env.VERCEL) app.listen(port, () => console.log(`Northstar ERP API listening on port ${port}`))

export default app