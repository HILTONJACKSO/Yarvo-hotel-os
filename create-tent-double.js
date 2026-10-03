const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tentDouble = await prisma.roomType.findFirst({ where: { name: 'Tent Double' } });
    if (tentDouble) {
        await prisma.room.create({
            data: {
                number: 'Tent-01',
                roomTypeId: tentDouble.id,
                status: 'CLEAN',
                floor: 1
            }
        });
        console.log("Created Tent-01 for Tent Double");
    } else {
        console.log("Tent Double not found");
    }
}
main().finally(() => prisma.$disconnect());
