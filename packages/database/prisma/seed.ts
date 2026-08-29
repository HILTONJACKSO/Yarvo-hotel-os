import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full access to all system features' },
    { name: 'MANAGER', description: 'Property manager with reporting and override access' },
    { name: 'FRONT_DESK', description: 'Front desk operations, check-in, check-out' },
    { name: 'HOUSEKEEPING', description: 'Room status management' },
    { name: 'ACCOUNTING', description: 'Financial reports and audits' },
  ];

  console.log('Seeding roles...');
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
  }

  // 2. Seed Super Admin User
  console.log('Seeding admin user...');
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (!superAdminRole) {
    throw new Error('SUPER_ADMIN role not found');
  }

  const adminEmail = 'admin@bellacasa.com';
  const rawPassword = 'BellaCasa@2026';
  
  // Hash the default password
  const passwordHash = await argon2.hash(rawPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      roles: { connect: [{ id: superAdminRole.id }] }
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      roles: { connect: [{ id: superAdminRole.id }] }
    },
  });

  console.log(`✅ Admin user seeded: ${adminUser.email}`);

  // 3. Seed Room Types
  console.log('Seeding room types...');
  const roomTypes = [
    {
      code: 'STD-DBL',
      name: 'Standard Double',
      description: 'Comfortable room with two double beds, perfect for families.',
      maxOccupancy: 4,
      maxAdults: 2,
      maxChildren: 2,
      baseRateUsd: 120.00,
      baseRateLrd: 22800.00,
      amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'],
    },
    {
      code: 'DLX-KNG',
      name: 'Deluxe King',
      description: 'Spacious room with a king-size bed and city view.',
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 1,
      baseRateUsd: 180.00,
      baseRateLrd: 34200.00,
      amenities: ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Ocean View'],
    },
    {
      code: 'PRS-STE',
      name: 'Presidential Suite',
      description: 'Luxurious top-floor suite with separate living and dining areas.',
      maxOccupancy: 4,
      maxAdults: 4,
      maxChildren: 2,
      baseRateUsd: 500.00,
      baseRateLrd: 95000.00,
      amenities: ['WiFi', 'AC', 'Smart TV', 'Mini Bar', 'Ocean View', 'Balcony', 'Jacuzzi'],
    }
  ];

  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { code: rt.code },
      update: {},
      create: rt,
    });
  }
  console.log('✅ Room types seeded.');

  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
