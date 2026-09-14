import sys

with open("apps/api/src/modules/audit-logs/audit-logs.controller.ts", "r", encoding="utf-8") as f:
    code = f.read()

old_ctrl = """  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  getLogs() {
    return this.auditLogsService.getLogs();
  }"""

new_ctrl = """  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  getLogs(@Query('start') start?: string, @Query('end') end?: string) {
    return this.auditLogsService.getLogs(start, end);
  }"""

code = code.replace(old_ctrl, new_ctrl)

# Also need to import Query
code = code.replace("import { Controller, Get } from '@nestjs/common';", "import { Controller, Get, Query } from '@nestjs/common';")

with open("apps/api/src/modules/audit-logs/audit-logs.controller.ts", "w", encoding="utf-8") as f:
    f.write(code)
