const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const tentSolo = await prisma.roomType.findFirst({ where: { name: 'Tent Solo' } });
    if (tentSolo) {
        await prisma.room.create({
            data: {
                number: 'Tent-01',
                roomTypeId: tentSolo.id,
                status: 'CLEAN',
                floor: 'Ground'
            }
        });
        console.log("Created Tent-01");
    }
}
main().finally(() => prisma.$disconnect());
