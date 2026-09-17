import sys

with open("apps/api/src/modules/analytics/analytics.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_method = """
  async getDiscounts(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // 1. Get Folio Discounts (Line Items with type ADJUSTMENT or description containing Discount)
    const folioDiscounts = await this.prisma.folioLineItem.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        OR: [
          { type: 'ADJUSTMENT' },
          { description: { contains: 'Discount', mode: 'insensitive' } }
        ]
      },
      include: {
        folio: {
          include: { reservation: { include: { guest: true, room: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Get POS Discounts (Orders with discountAmount > 0)
    const posDiscounts = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        discountAmount: { gt: 0 }
      },
      include: { table: true },
      orderBy: { createdAt: 'desc' }
    });

    // Format and combine
    const formattedFolio = folioDiscounts.map(d => ({
      id: d.id,
      source: 'FOLIO',
      date: d.createdAt,
      amount: d.amount,
      description: d.description || 'Folio Adjustment',
      reference: d.folio?.reservation?.guest ? `${d.folio.reservation.guest.firstName} ${d.folio.reservation.guest.lastName} (Room ${d.folio.reservation.room?.number || 'N/A'})` : 'Unknown Folio'
    }));

    const formattedPos = posDiscounts.map(d => ({
      id: d.id,
      source: 'POS',
      date: d.createdAt,
      amount: d.discountAmount,
      description: d.notes ? `POS Discount - ${d.notes}` : 'POS Discount',
      reference: d.table ? `Table ${d.table.number}` : 'Takeout/Walk-in'
    }));

    const combined = [...formattedFolio, ...formattedPos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }
"""

code = code.rsplit('}', 1)
new_code = code[0] + new_method + '}'
with open("apps/api/src/modules/analytics/analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(new_code)
