const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'yarvo@gmail.com';
  const rawPassword = 'YOSar@2026';
  
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (!superAdminRole) {
    console.error('SUPER_ADMIN role not found');
    return;
  }

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
      firstName: 'Yarvo',
      lastName: 'Admin',
      roles: { connect: [{ id: superAdminRole.id }] }
    },
  });

  console.log('User created:', adminUser.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
