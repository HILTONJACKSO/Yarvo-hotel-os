const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.inventoryRecipe.deleteMany({});
  await prisma.posOrderItem.deleteMany({});
  await prisma.posOrder.deleteMany({});
  await prisma.posMenuItem.deleteMany({});
  await prisma.posCategory.deleteMany({});
  console.log('Successfully cleared all POS menu items, categories, and related orders/recipes!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
