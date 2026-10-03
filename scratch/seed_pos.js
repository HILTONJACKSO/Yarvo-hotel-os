const fs = require('fs');

let content = fs.readFileSync('packages/database/prisma/seed.ts', 'utf8');

const seedPos = `
  // 6. Seed POS Items (Digital Menu)
  console.log('Seeding POS Menu Items...');
  
  const foodCategory = await prisma.posCategory.create({
    data: { name: 'Food', description: 'Delicious meals' }
  });
  
  const drinksCategory = await prisma.posCategory.create({
    data: { name: 'Drinks', description: 'Refreshing beverages' }
  });

  await prisma.posMenuItem.createMany({
    data: [
      {
        categoryId: foodCategory.id,
        name: 'Grilled Lobster',
        description: 'Fresh local lobster with garlic butter',
        price: 35.00,
        type: 'FOOD',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80'
      },
      {
        categoryId: foodCategory.id,
        name: 'Wagyu Burger',
        description: 'Premium beef with aged cheddar and truffle fries',
        price: 24.00,
        type: 'FOOD',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'
      },
      {
        categoryId: foodCategory.id,
        name: 'Margherita Pizza',
        description: 'Wood-fired pizza with fresh basil and mozzarella',
        price: 18.00,
        type: 'FOOD',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80'
      },
      {
        categoryId: drinksCategory.id,
        name: 'Signature Mojito',
        description: 'Classic rum mojito with fresh mint',
        price: 12.00,
        type: 'BEVERAGE',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=400&q=80'
      },
      {
        categoryId: drinksCategory.id,
        name: 'Tropical Sunset',
        description: 'Mango, passionfruit, and prosecco',
        price: 14.00,
        type: 'BEVERAGE',
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80'
      }
    ]
  });
`;

if (!content.includes('Seeding POS Menu Items')) {
  // Insert before the console.log('Seeding finished.');
  const insertTarget = "console.log('Seeding finished.');";
  content = content.replace(insertTarget, seedPos + '\n  ' + insertTarget);
  fs.writeFileSync('packages/database/prisma/seed.ts', content, 'utf8');
  console.log('Added POS seeding!');
} else {
  console.log('Already has POS seeding');
}
