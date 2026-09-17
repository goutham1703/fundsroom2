import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
  { email: 'admin@northstar.in', password: 'admin123', name: 'Arjun Kumar', role: 'ADMIN' },
  { email: 'sales@northstar.in', password: 'sales123', name: 'Priya Shah', role: 'SALES_USER' },
]

for (const user of users) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: { name: user.name, role: user.role, isActive: true, passwordHash: await bcrypt.hash(user.password, 12) },
    create: { email: user.email, name: user.name, role: user.role, passwordHash: await bcrypt.hash(user.password, 12) },
  })
}

await prisma.$disconnect()
console.log('Seeded Northstar admin and sales users')