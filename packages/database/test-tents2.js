const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const types = await prisma.roomType.findMany();
    console.log("Room Types:");
    console.dir(types, {depth: null});
}
main().finally(() => prisma.$disconnect());
