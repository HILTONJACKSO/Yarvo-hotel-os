import re

path = "apps/api/src/modules/pos/pos.service.ts"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

pattern = r"// Recalculate total amount for the order if it hasn't been PAID\s*const order = returnReq\.orderItem\.order;\s*if \(order\.status !== 'PAID' && order\.status !== 'BILLED_TO_ROOM'\) \{\s*await this\.recalculateOrderTotal\(order\.id\);\s*\}"

replace_str = """      // Always recalculate total amount for the order so dashboard revenue is accurate
      const order = returnReq.orderItem.order;
      await this.recalculateOrderTotal(order.id);

      // If it was already paid in cash/pos, we must log a negative payment to offset the revenue
      if (order.status === 'PAID') {
        const returnedItemTotal = Number(returnReq.orderItem.menuItem.price) * returnReq.orderItem.quantity;
        let totalPercentage = 0;
        let totalFlat = 0;
        (returnReq.orderItem.menuItem as any).taxes?.forEach((tax: any) => {
          if (tax.isActive) {
            if (tax.type === 'PERCENTAGE') totalPercentage += Number(tax.rate);
            else if (tax.type === 'FLAT_AMOUNT') totalFlat += Number(tax.rate) * returnReq.orderItem.quantity;
          }
        });
        const returnedTax = (returnedItemTotal * totalPercentage / 100) + totalFlat;
        const refundAmount = returnedItemTotal + returnedTax;

        // Find original payment method if possible, otherwise use 'CASH'
        const payments = await this.prisma.posPayment.findMany({ where: { orderId: order.id } });
        const method = payments.length > 0 ? payments[0].method : 'CASH';

        await this.prisma.posPayment.create({
          data: {
            orderId: order.id,
            amount: -refundAmount,
            method
          }
        });
      } else if (order.status === 'BILLED_TO_ROOM' && order.folioId) {
        // Offset folio balance
        const returnedItemTotal = Number(returnReq.orderItem.menuItem.price) * returnReq.orderItem.quantity;
        let totalPercentage = 0;
        let totalFlat = 0;
        (returnReq.orderItem.menuItem as any).taxes?.forEach((tax: any) => {
          if (tax.isActive) {
            if (tax.type === 'PERCENTAGE') totalPercentage += Number(tax.rate);
            else if (tax.type === 'FLAT_AMOUNT') totalFlat += Number(tax.rate) * returnReq.orderItem.quantity;
          }
        });
        const returnedTax = (returnedItemTotal * totalPercentage / 100) + totalFlat;
        const refundAmount = returnedItemTotal + returnedTax;

        await this.prisma.folio.update({
          where: { id: order.folioId },
          data: { balance: { decrement: refundAmount } }
        });
        
        // Also add a line item so it shows on Folio!
        await this.prisma.folioLineItem.create({
          data: {
            folioId: order.folioId,
            amount: -refundAmount,
            description: `Refund for POS Order #${order.id.substring(0,8)} - ${returnReq.orderItem.menuItem.name}`,
            category: 'RESTAURANT_BAR',
            type: 'ADJUSTMENT'
          }
        });
      }"""

if re.search(pattern, c):
    c = re.sub(pattern, replace_str, c)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("Patched approveReturn in pos.service.ts")
else:
    print("Could not find pattern for approveReturn")
