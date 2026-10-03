import re

path = "apps/api/src/modules/analytics/analytics.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern1 = r"const posDiscounts = await this\.prisma\.posOrder\.findMany\(\{\s*where: \{\s*createdAt: \{ gte: start, lte: end \},\s*discountAmount: \{ gt: 0 \}\s*\},\s*include: \{ table: true \},\s*orderBy: \{ createdAt: 'desc' \}\s*\}\);"
replace1 = """const posDiscounts = await this.prisma.posOrder.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        discountAmount: { gt: 0 }
      },
      include: { table: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' }
    });"""

pattern2 = r"const formattedPos = posDiscounts\.map\(\(d: any\) => \(\{\s*id: d\.id,\s*source: 'POS',\s*date: d\.createdAt,\s*amount: d\.discountAmount,\s*description: d\.discountReason \? `POS Discount - \$\{d\.discountReason\}` : 'POS Discount',\s*reference: d\.table \? `Table \$\{d\.table\.number\}` : 'Takeout/Walk-in'\s*\}\)\);"

replace2 = """const formattedPos = posDiscounts.map((d: any) => {
      const itemsStr = d.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ') || 'POS Discount';
      return {
        id: d.id,
        source: 'POS',
        date: d.createdAt,
        amount: d.discountAmount,
        description: d.discountReason ? `${itemsStr} - ${d.discountReason}` : itemsStr,
        reference: d.table ? `Table ${d.table.number}` : 'Takeout/Walk-in'
      };
    });"""

if re.search(pattern1, c) and re.search(pattern2, c):
    c = re.sub(pattern1, replace1, c)
    c = re.sub(pattern2, replace2, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched posDiscounts via regex")
else:
    print("Regex not found")
