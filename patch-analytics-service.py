import sys

with open("apps/api/src/modules/analytics/analytics.service.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Replace getProfitAndLoss
old_pnl = """  async getProfitAndLoss() {
    const revenueItems = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { type: 'CHARGE' },
    });

    const expenseItems = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
    });"""

new_pnl = """  async getProfitAndLoss(start?: string, end?: string) {
    const whereRevenue: any = { type: 'CHARGE' };
    const whereExpense: any = {};

    if (start && end) {
      const gte = new Date(start);
      const lte = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
      whereRevenue.createdAt = { gte, lte };
      whereExpense.date = { gte, lte };
    }

    const revenueItems = await this.prisma.folioLineItem.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: whereRevenue,
    });

    const expenseItems = await this.prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: whereExpense,
    });"""

code = code.replace(old_pnl, new_pnl)

# Replace getTrialBalance
old_tb = """  async getTrialBalance() {
    // Assets & Expenses = Debits
    // Liabilities & Revenue = Credits
    const pnl = await this.getProfitAndLoss();
    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: { type: 'PAYMENT' }
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    // Unpaid Folios (AR)
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: { status: 'OPEN' }
    });"""

new_tb = """  async getTrialBalance(start?: string, end?: string) {
    // Assets & Expenses = Debits
    // Liabilities & Revenue = Credits
    const pnl = await this.getProfitAndLoss(start, end);
    const wherePayments: any = { type: 'PAYMENT' };
    if (start && end) {
      wherePayments.createdAt = {
        gte: new Date(start),
        lte: new Date(new Date(end).setUTCHours(23, 59, 59, 999))
      };
    }
    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: wherePayments
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    // Unpaid Folios (AR)
    const whereFolios: any = { status: 'OPEN' };
    if (start && end) {
      whereFolios.updatedAt = {
        gte: new Date(start),
        lte: new Date(new Date(end).setUTCHours(23, 59, 59, 999))
      };
    }
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: whereFolios
    });"""

code = code.replace(old_tb, new_tb)

# Replace getBalanceSheet
old_bs = """  async getBalanceSheet() {
    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: { type: 'PAYMENT' }
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: { status: 'OPEN' }
    });"""

new_bs = """  async getBalanceSheet(start?: string, end?: string) {
    const wherePayments: any = { type: 'PAYMENT' };
    const whereFolios: any = { status: 'OPEN' };

    if (start && end) {
      const gte = new Date(start);
      const lte = new Date(new Date(end).setUTCHours(23, 59, 59, 999));
      wherePayments.createdAt = { gte, lte };
      whereFolios.updatedAt = { gte, lte };
    }

    const payments = await this.prisma.folioLineItem.aggregate({
      _sum: { amount: true },
      where: wherePayments
    });
    const cash = payments._sum.amount ? payments._sum.amount.toNumber() : 0;
    
    const openFolios = await this.prisma.folio.aggregate({
      _sum: { balance: true },
      where: whereFolios
    });"""

code = code.replace(old_bs, new_bs)

with open("apps/api/src/modules/analytics/analytics.service.ts", "w", encoding="utf-8") as f:
    f.write(code)
