import sys

with open("apps/api/src/modules/night-audit/night-audit.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

calc_old = """      const paymentsAggr = await this.prisma.folioLineItem.aggregate({
        _sum: { amount: true },
        where: { type: 'PAYMENT', createdAt: { gte: startOfDay, lt: endOfDay } }
      });"""

calc_new = """      const paymentsAggr = await this.prisma.folioLineItem.aggregate({
        _sum: { amount: true },
        where: { type: 'PAYMENT', createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      const ticketsAggr = await this.prisma.ticket.aggregate({
        _sum: { price: true },
        where: { issueDate: { gte: startOfDay, lt: endOfDay }, status: { in: ['VALID', 'USED'] } }
      });

      const folioDiscountsAggr = await this.prisma.folioLineItem.aggregate({
        _sum: { amount: true },
        where: { OR: [{ type: 'ADJUSTMENT' }, { description: { contains: 'Discount', mode: 'insensitive' } }], createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      const posDiscountsAggr = await this.prisma.posOrder.aggregate({
        _sum: { discountAmount: true },
        where: { createdAt: { gte: startOfDay, lt: endOfDay } }
      });

      const totalDiscounts = Math.abs(Number(folioDiscountsAggr._sum.amount || 0)) + Number(posDiscountsAggr._sum.discountAmount || 0);"""

code = code.replace(calc_old, calc_new)

save_old = """          totalRoomRevenue: roomRevAggr._sum.amount || 0,
          totalFbRevenue: fbRevAggr._sum.totalAmount || 0,
          totalPayments: paymentsAggr._sum.amount || 0,
          notes: `Posted charges for ${postedCount} rooms. Total room charge amount: $${totalPostedAmount.toFixed(2)}`"""

save_new = """          totalRoomRevenue: roomRevAggr._sum.amount || 0,
          totalFbRevenue: fbRevAggr._sum.totalAmount || 0,
          totalPayments: paymentsAggr._sum.amount || 0,
          totalTicketRevenue: ticketsAggr._sum.price || 0,
          totalDiscounts: totalDiscounts,
          notes: `Posted charges for ${postedCount} rooms. Total room charge amount: $${totalPostedAmount.toFixed(2)}`"""

code = code.replace(save_old, save_new)

with open("apps/api/src/modules/night-audit/night-audit.service.ts", "w", encoding="utf-8") as f:
    f.write(code)
