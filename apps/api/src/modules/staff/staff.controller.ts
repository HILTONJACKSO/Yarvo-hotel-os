import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StaffService } from './staff.service';

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
  getShifts(@Query('date') date?: string) {
    return this.staffService.getShifts(date);
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
  getAttendance(@Query('date') date?: string) {
    return this.staffService.getAttendances(date);
  }

  @Post('attendance/clock-in')
  clockIn(@Body() data: any) {
    return this.staffService.clockIn(data);
  }

  @Put('attendance/:id/clock-out')
  clockOut(@Param('id') id: string, @Body() data: any) {
    return this.staffService.clockOut(id, data?.notes);
  }

  // ─── PAYROLL ────────────────────────────────────────────────────────────────

  @Get('payroll')
  getPayslips() {
    return this.staffService.getPayslips();
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
}

