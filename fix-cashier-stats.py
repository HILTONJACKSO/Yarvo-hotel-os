import sys

with open("apps/api/src/modules/pos/pos.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_stats = """  async getDailyCashierStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payments = await this.prisma.posPayment.findMany({
      where: {
        createdAt: { gte: today }
      }
    });

    const totalOrders = new Set(payments.map(p => p.orderId)).size;
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return { totalOrders, totalRevenue };
  }"""

new_stats = """  async getDailyCashierStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all orders settled today
    const settledOrders = await this.prisma.posOrder.findMany({
      where: {
        status: { in: ['PAID', 'BILLED_TO_ROOM'] },
        updatedAt: { gte: today }
      }
    });

    const totalOrders = settledOrders.length;
    // Calculate total actual revenue strictly from what was paid or billed to room
    const totalRevenue = settledOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return { totalOrders, totalRevenue };
  }"""

code = code.replace(old_stats, new_stats)

with open("apps/api/src/modules/pos/pos.service.ts", "w", encoding="utf-8") as f:
    f.write(code)
