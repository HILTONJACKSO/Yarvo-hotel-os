const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const types = await prisma.roomType.findMany();
    console.log("Room Types:", types.map(t => t.name));
    
    const rooms = await prisma.room.findMany();
    console.log("Rooms:", rooms.map(r => r.number));
    
    const tables = await prisma.posTable.findMany();
    console.log("Tables:", tables.map(t => t.number));
}
main().finally(() => prisma.$disconnect());
