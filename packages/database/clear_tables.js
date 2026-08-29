const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.posTable.deleteMany({});
  console.log('Deleted all tables');
}

main().catch(console.error).finally(() => prisma.$disconnect());
