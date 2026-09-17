const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const guest = await prisma.guest.findFirst({ where: { firstName: 'Mary', lastName: 'Brown' }});
  if (!guest) return console.log("Guest not found");

  const reservations = await prisma.reservation.findMany({
    where: { guestId: guest.id },
    include: { folio: true }
  });

  console.dir({guest, reservations}, {depth: null});
}
main().catch(console.error).finally(() => prisma.$disconnect());
