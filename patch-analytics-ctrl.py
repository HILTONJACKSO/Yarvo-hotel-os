import sys

with open("apps/api/src/modules/analytics/analytics.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

# I need to add @Query('start') and @Query('end')

old_pnl = """  @Get('reports/pnl')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Profit & Loss statement' })
  async getProfitAndLoss() {
    const data = await this.analyticsService.getProfitAndLoss();"""

new_pnl = """  @Get('reports/pnl')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Profit & Loss statement' })
  async getProfitAndLoss(@Query('start') start?: string, @Query('end') end?: string) {
    const data = await this.analyticsService.getProfitAndLoss(start, end);"""

code = code.replace(old_pnl, new_pnl)

old_tb = """  @Get('reports/trial-balance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Trial Balance' })
  async getTrialBalance() {
    const data = await this.analyticsService.getTrialBalance();"""

new_tb = """  @Get('reports/trial-balance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Trial Balance' })
  async getTrialBalance(@Query('start') start?: string, @Query('end') end?: string) {
    const data = await this.analyticsService.getTrialBalance(start, end);"""

code = code.replace(old_tb, new_tb)

old_bs = """  @Get('reports/balance-sheet')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  async getBalanceSheet() {
    const data = await this.analyticsService.getBalanceSheet();"""

new_bs = """  @Get('reports/balance-sheet')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  async getBalanceSheet(@Query('start') start?: string, @Query('end') end?: string) {
    const data = await this.analyticsService.getBalanceSheet(start, end);"""

code = code.replace(old_bs, new_bs)

with open("apps/api/src/modules/analytics/analytics.controller.ts", "w", encoding="utf-8") as f:
    f.write(code)
