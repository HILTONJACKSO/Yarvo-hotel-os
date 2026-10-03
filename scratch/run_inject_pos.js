const { execSync } = require('child_process');
const fs = require('fs');

const script = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.posMenuItem.findMany();
  console.log('Items in DB:', items.length);
  
  // Create them if missing regardless of category
  if (items.length === 0) {
    console.log('Injecting items directly...');
    const foodCategory = await prisma.posCategory.create({
      data: { name: 'Food', description: 'Delicious meals' }
    });
    
    const drinksCategory = await prisma.posCategory.create({
      data: { name: 'Drinks', description: 'Refreshing beverages' }
    });

    await prisma.posMenuItem.createMany({
      data: [
        { categoryId: foodCategory.id, name: 'Grilled Lobster', description: 'Fresh local lobster with garlic butter', price: 35.00, type: 'FOOD', isAvailable: true, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80' },
        { categoryId: foodCategory.id, name: 'Wagyu Burger', description: 'Premium beef with aged cheddar and truffle fries', price: 24.00, type: 'FOOD', isAvailable: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
        { categoryId: foodCategory.id, name: 'Margherita Pizza', description: 'Wood-fired pizza with fresh basil and mozzarella', price: 18.00, type: 'FOOD', isAvailable: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80' },
        { categoryId: drinksCategory.id, name: 'Signature Mojito', description: 'Classic rum mojito with fresh mint', price: 12.00, type: 'BEVERAGE', isAvailable: true, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80' },
        { categoryId: drinksCategory.id, name: 'Tropical Sunset', description: 'Mango, passionfruit, and prosecco', price: 14.00, type: 'BEVERAGE', isAvailable: true, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80' }
      ]
    });
    console.log('Injected POS data successfully!');
  }
}

main().catch(e => console.error(e)).finally(async () => await prisma.$disconnect());
`;

fs.writeFileSync('inject_pos.js', script);
execSync('scp -o ConnectTimeout=15 -o StrictHostKeyChecking=no inject_pos.js root@82.29.175.72:/root/bellacasa/inject_pos.js', { stdio: 'inherit' });
execSync('ssh -o ConnectTimeout=15 -o StrictHostKeyChecking=no root@82.29.175.72 "docker cp /root/bellacasa/inject_pos.js bellacasa-api:/app/inject_pos.js && docker exec bellacasa-api node /app/inject_pos.js"', { stdio: 'inherit' });
