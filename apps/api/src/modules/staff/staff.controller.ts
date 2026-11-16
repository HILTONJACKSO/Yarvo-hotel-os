import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { StaffService } from './staff.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ─── PROFILES ─────────────────────────────────────────────────────────────

  @Get('profiles')
  getProfiles() {
    return this.staffService.getStaffProfiles();
  }

  @Get('profiles/:id')
  getProfile(@Param('id') id: string) {
    return this.staffService.getStaffProfile(id);
  }

  @Put('profiles/:id')
  upsertProfile(@Param('id') id: string, @Body() data: any) {
    return this.staffService.upsertStaffProfile(id, data);
  }

  // ─── SHIFTS ─────────────────────────────────────────────────────────────────

  @Get('shifts')
  getShifts(
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
    @Query('userId') userId?: string,
  ) {
    return this.staffService.getShifts(date, startDate, endDate, department, userId);
  }

  @Post('shifts')
  createShift(@Body() data: any) {
    return this.staffService.createShift(data);
  }

  @Put('shifts/:id')
  updateShift(@Param('id') id: string, @Body() data: any) {
    return this.staffService.updateShift(id, data);
  }

  @Delete('shifts/:id')
  deleteShift(@Param('id') id: string) {
    return this.staffService.deleteShift(id);
  }

  // ─── ATTENDANCE ─────────────────────────────────────────────────────────────

  @Get('attendance')
  getAttendance(@Query('date') date?: string, @Req() req?: any) {
    const isManager = req?.user?.roles?.some((r: any) =>
      ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR'].includes(
        (typeof r === 'string' ? r : r?.name || '').toUpperCase(),
      ),
    );
    const filterUserId = isManager ? undefined : req?.user?.id;
    return this.staffService.getAttendances(date, filterUserId);
  }

  @Post('attendance/clock-in')
  clockIn(@Body() data: any, @Req() req?: any) {
    return this.staffService.clockIn(data, req?.user);
  }

  @Put('attendance/:id/clock-out')
  clockOut(@Param('id') id: string, @Body() data: any, @Req() req?: any) {
    return this.staffService.clockOut(id, data, req?.user);
  }

  @Put('attendance/:id/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR')
  approveAttendanceRequest(
    @Param('id') id: string,
    @Body() data: { approved: boolean; note?: string },
    @Req() req?: any,
  ) {
    return this.staffService.approveAttendanceRequest(id, data, req?.user);
  }

  // ─── PAYROLL ────────────────────────────────────────────────────────────────

  @Get('payroll')
  getPayslips(@Query('periodStart') start?: string, @Query('periodEnd') end?: string, @Req() req?: any) {
    const isManager = req?.user?.roles?.some((r: any) =>
      ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR'].includes(
        (typeof r === 'string' ? r : r?.name || '').toUpperCase(),
      ),
    );
    const filterUserId = isManager ? undefined : req?.user?.id;
    return this.staffService.getPayslips(start, end, filterUserId);
  }

  @Get('payroll/summary')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  getPayrollSummary(@Query('periodStart') start: string, @Query('periodEnd') end: string) {
    return this.staffService.getPayrollSummary(start, end);
  }

  @Get('payroll/stats')
  getPayrollStats() {
    return this.staffService.getPayrollStats();
  }

  @Post('payroll')
  generatePayslip(@Body() data: any) {
    return this.staffService.generatePayslip(data.userId, data);
  }

  @Put('payroll/:id/status')
  updatePayslipStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.staffService.updatePayslipStatus(id, status);
  }

  @Put('payroll/:id/details')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER')
  updatePayslip(@Param('id') id: string, @Body() data: any) {
    return this.staffService.updatePayslip(id, data);
  }
}
