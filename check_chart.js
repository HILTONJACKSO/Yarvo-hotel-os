const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const startOfPeriod = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const payments = await prisma.folioLineItem.findMany({
    where: { type: 'PAYMENT', createdAt: { gte: startOfPeriod } },
    select: { amount: true, createdAt: true },
  });

  const posPayments = await prisma.posPayment.findMany({
    where: { createdAt: { gte: startOfPeriod } },
    select: { amount: true, createdAt: true },
  });

  const tickets = await prisma.ticket.findMany({
    where: { issueDate: { gte: startOfPeriod }, status: { in: ['VALID', 'USED'] } },
    select: { price: true, issueDate: true },
  });

  const dailyRevenue = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    dailyRevenue[dateStr] = 0;
  }

  payments.forEach((payment) => {
    const dateStr = payment.createdAt.toISOString().split('T')[0];
    if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += payment.amount.toNumber();
  });

  posPayments.forEach((payment) => {
    const dateStr = payment.createdAt.toISOString().split('T')[0];
    if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += payment.amount.toNumber();
  });

  tickets.forEach((ticket) => {
    const dateStr = ticket.issueDate.toISOString().split('T')[0];
    if (dailyRevenue[dateStr] !== undefined) dailyRevenue[dateStr] += ticket.price.toNumber();
  });

  console.log(dailyRevenue);
}

main().catch(console.error).finally(() => prisma.$disconnect());
