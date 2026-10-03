const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const types = await prisma.roomType.findMany();
    console.log("Room Types:", types.map(t => t.name));
    
    const rooms = await prisma.room.findMany({ include: { type: true }});
    console.log("Rooms count:", rooms.length);
    console.log("Rooms:", rooms.slice(0, 5).map(r => r.number + ' (' + r.type.name + ')'));
}
main().finally(() => prisma.$disconnect());
