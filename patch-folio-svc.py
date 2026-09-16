import sys

with open("apps/api/src/modules/folios/folios.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

new_method = """  async closeFolio(folioId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const folio = await tx.folio.findUnique({ where: { id: folioId } });
      if (!folio) throw new NotFoundException(`Folio not found`);
      if (folio.status === 'CLOSED') throw new BadRequestException('Folio is already closed.');
      if (Number(folio.balance) !== 0) {
         throw new BadRequestException('Cannot close a folio with a non-zero balance.');
      }

      return tx.folio.update({
        where: { id: folioId },
        data: { status: 'CLOSED' }
      });
    });
  }
"""

# inject right before the last closing brace
code = code.rsplit('}', 1)
new_code = code[0] + new_method + '}'
with open("apps/api/src/modules/folios/folios.service.ts", "w", encoding="utf-8") as f:
    f.write(new_code)
