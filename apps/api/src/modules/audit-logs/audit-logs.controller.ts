import { Controller, Get } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit Logs')
@ApiCookieAuth('accessToken')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  getLogs() {
    return this.auditLogsService.getLogs();
  }
}
