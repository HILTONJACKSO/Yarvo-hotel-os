import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { NightAuditService } from './night-audit.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(RolesGuard)
@Controller('night-audit')
export class NightAuditController {
  constructor(private readonly nightAuditService: NightAuditService) {}

  @Post('run')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  async runAudit(@CurrentUser() user: any) {
    const data = await this.nightAuditService.runAudit(user.id);
    return { message: 'Night Audit completed successfully', data };
  }

  @Get('history')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  async getHistory() {
    const data = await this.nightAuditService.getHistory();
    return { data };
  }
}

