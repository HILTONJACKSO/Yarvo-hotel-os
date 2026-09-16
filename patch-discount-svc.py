import sys

with open("apps/api/src/modules/folios/folios.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_method = """  async postDiscount(folioId: string, paymentDto: CreatePaymentDto, userId?: string) {
    if (paymentDto.amount <= 0) {
      throw new BadRequestException('Discount amount must be greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Cannot post discounts to a closed folio.');

      // 1. Create the Line Item
      const lineItem = await tx.folioLineItem.create({
        data: {
          folioId,
          type: 'ADJUSTMENT',
          category: 'OTHER',
          amount: new Prisma.Decimal(paymentDto.amount * -1), // Negative amount for discount logic or positive depending on UI? Wait, postPayment did positive, but balance decrements. For ADJUSTMENT, if we decrement balance, we might as well keep it positive in LineItem or negative. I will keep it positive for consistency and decrement the folio balance.
          description: paymentDto.description || 'Discount',
          referenceCode: paymentDto.referenceCode,
          createdById: userId,
        },
      });

      // 2. Update Folio Balance (Subtract discount amount from balance)
      await tx.folio.update({
        where: { id: folioId },
        data: {
          balance: { decrement: paymentDto.amount },
        },
      });

      return lineItem;
    });
  }
"""

code = code.rsplit('}', 1)
new_code = code[0] + new_method + '}'
with open("apps/api/src/modules/folios/folios.service.ts", "w", encoding="utf-8") as f:
    f.write(new_code)
