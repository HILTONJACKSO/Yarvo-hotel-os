const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tiers = [
    { name: 'Entry Adult', price: 5.00 },
    { name: 'Entry Kid', price: 3.00 },
    { name: 'Pool Adult', price: 10.00 },
    { name: 'Pool Kid', price: 5.00 }
  ];

  for (const tier of tiers) {
    const existing = await prisma.ticketTier.findFirst({ where: { name: tier.name } });
    if (!existing) {
      await prisma.ticketTier.create({ data: tier });
      console.log('Created ' + tier.name);
    } else {
      console.log(tier.name + ' already exists');
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
