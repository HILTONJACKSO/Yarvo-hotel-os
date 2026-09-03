const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" }
    });
    console.log("LOGS:", JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
