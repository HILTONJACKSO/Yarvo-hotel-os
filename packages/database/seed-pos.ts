import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding POS Data...');

  // Create Tables
  const tables = await Promise.all([
    prisma.posTable.create({ data: { number: '1', capacity: 2 } }),
    prisma.posTable.create({ data: { number: '2', capacity: 2 } }),
    prisma.posTable.create({ data: { number: '3', capacity: 4 } }),
    prisma.posTable.create({ data: { number: '4', capacity: 4 } }),
    prisma.posTable.create({ data: { number: '5', capacity: 6 } }),
  ]);
  console.log(`Created ${tables.length} tables.`);

  // Create Categories
  const catFood = await prisma.posCategory.create({ data: { name: 'Main Course' } });
  const catApps = await prisma.posCategory.create({ data: { name: 'Appetizers' } });
  const catDrinks = await prisma.posCategory.create({ data: { name: 'Cocktails' } });

  // Create Menu Items
  await prisma.posMenuItem.createMany({
    data: [
      { name: 'Truffle Fries', price: 8.99, type: 'FOOD', categoryId: catApps.id },
      { name: 'Calamari', price: 12.50, type: 'FOOD', categoryId: catApps.id },
      { name: 'Wagyu Burger', price: 24.99, type: 'FOOD', categoryId: catFood.id },
      { name: 'Margherita Pizza', price: 18.00, type: 'FOOD', categoryId: catFood.id },
      { name: 'Old Fashioned', price: 14.00, type: 'DRINK', categoryId: catDrinks.id },
      { name: 'Espresso Martini', price: 16.00, type: 'DRINK', categoryId: catDrinks.id },
    ]
  });
  console.log('Created menu items and categories.');

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
