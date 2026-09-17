const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.room.update({
    where: { number: 'R-02' },
    data: { status: 'DIRTY' }
  });
  console.log("Updated R-02 to DIRTY");
}
main().catch(console.error).finally(() => prisma.$disconnect());
