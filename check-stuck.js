const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rooms = await prisma.room.findMany({
    where: { status: 'OCCUPIED' },
    include: { reservations: { where: { status: 'CHECKED_IN' } } }
  });
  const stuckRooms = rooms.filter(r => r.reservations.length === 0);
  console.log("Stuck rooms:", stuckRooms.map(r => r.number));
  
  if (stuckRooms.length > 0) {
    await prisma.room.updateMany({
      where: { id: { in: stuckRooms.map(r => r.id) } },
      data: { status: 'DIRTY' }
    });
    console.log("Fixed stuck rooms to DIRTY");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
