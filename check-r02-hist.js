const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room = await prisma.room.findUnique({ where: { number: 'R-02' }});
  const history = await prisma.roomStatusHistory.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.dir(history, {depth: null});
}
main().catch(console.error).finally(() => prisma.$disconnect());
