const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const types = await prisma.roomType.findMany();
    console.log("Room Types:", types.map(t => t.name));
    
    const rooms = await prisma.room.findMany({ include: { roomType: true }});
    console.log("Rooms count:", rooms.length);
    console.log("Rooms:", rooms.slice(0, 10).map(r => r.number + ' (' + r.roomType.name + ')'));
}
main().finally(() => prisma.$disconnect());
