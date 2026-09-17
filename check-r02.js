const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const room = await prisma.room.findUnique({ where: { number: 'R-02' }});
  
  const reservations = await prisma.reservation.findMany({
    where: { roomId: room.id, status: 'CHECKED_IN' },
    include: { guest: true }
  });

  console.dir({room, reservations}, {depth: null});
}
main().catch(console.error).finally(() => prisma.$disconnect());
