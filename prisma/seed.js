import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Promote the first user to superadmin (if any exist)
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (firstUser) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'superadmin' },
    })
    console.log(`Usuario "${firstUser.email}" promovido a superadmin`)
  } else {
    console.log('No hay usuarios. Registra uno y vuelve a ejecutar el seed.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
