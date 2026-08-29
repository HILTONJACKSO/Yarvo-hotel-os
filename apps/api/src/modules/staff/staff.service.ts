import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── STAFF PROFILES ─────────────────────────────────────────────────────────

  async getStaffProfiles() {
    return this.prisma.user.findMany({
      include: {
        roles: true,
        staffProfile: true,
      },
    });
  }

  async getStaffProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        staffProfile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async upsertStaffProfile(userId: string, data: any) {
    // Make sure user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.staffProfile.upsert({
      where: { userId },
      update: {
        department: data.department,
        jobTitle: data.jobTitle,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        baseSalary: data.baseSalary,
        hourlyRate: data.hourlyRate,
        payPeriod: data.payPeriod,
      },
      create: {
        userId,
        department: data.department || 'General',
        jobTitle: data.jobTitle || 'Staff',
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
        baseSalary: data.baseSalary || 0,
        hourlyRate: data.hourlyRate || 0,
        payPeriod: data.payPeriod || 'MONTHLY',
      },
    });
  }

  // ─── SHIFTS ─────────────────────────────────────────────────────────────────

  async getShifts(date?: string) {
    return this.prisma.shift.findMany({
      where: date ? { date: new Date(date) } : undefined,
      include: {
        user: true,
        attendances: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createShift(data: any) {
    return this.prisma.shift.create({
      data: {
        userId: data.userId,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        department: data.department,
        status: data.status || 'SCHEDULED',
      },
    });
  }

  async updateShift(id: string, data: any) {
    return this.prisma.shift.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        department: data.department,
        status: data.status,
      },
    });
  }

  async deleteShift(id: string) {
    return this.prisma.shift.delete({ where: { id } });
  }

  // ─── ATTENDANCE ─────────────────────────────────────────────────────────────

  async getAttendances(date?: string) {
    return this.prisma.attendance.findMany({
      where: date ? { date: new Date(date) } : undefined,
      include: {
        user: true,
        shift: true,
      },
      orderBy: { clockIn: 'desc' },
    });
  }

  async clockIn(data: any) {
    // If we want the system to auto-record time:
    const clockInTime = new Date();
    // Assuming date is today's date based on clockInTime
    const dateStr = clockInTime.toISOString().split('T')[0];
    
    return this.prisma.attendance.create({
      data: {
        userId: data.userId,
        shiftId: data.shiftId,
        date: new Date(dateStr),
        clockIn: clockInTime,
        status: data.status || 'PRESENT',
        notes: data.notes,
      },
    });
  }

  async clockOut(id: string, notes?: string) {
    return this.prisma.attendance.update({
      where: { id },
      data: {
        clockOut: new Date(),
        ...(notes ? { notes } : {}),
      },
    });
  }

  // ─── PAYROLL ────────────────────────────────────────────────────────────────

  async getPayslips() {
    return this.prisma.payslip.findMany({
      include: { user: true },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getPayrollStats() {
    // Get payslips from the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1); // Start of that month

    const payslips = await this.prisma.payslip.findMany({
      where: {
        periodStart: { gte: twelveMonthsAgo }
      }
    });

    // Group by month (YYYY-MM)
    const monthlyData: Record<string, number> = {};
    
    // Initialize last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthStr] = 0;
    }

    payslips.forEach(ps => {
      const monthStr = ps.periodStart.toISOString().slice(0, 7);
      if (monthlyData[monthStr] !== undefined) {
        monthlyData[monthStr] += Number(ps.netPay);
      }
    });

    return Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total
    }));
  }

  async generatePayslip(userId: string, data: any) {
    const basePay = Number(data.basePay || 0);
    const overtimePay = Number(data.overtimePay || 0);
    const grossPay = basePay + overtimePay;
    
    // Tax is calculated as a percentage of gross pay
    const taxDeduction = data.taxRate ? (grossPay * (Number(data.taxRate) / 100)) : 0;
    const netPay = grossPay - taxDeduction;

    return this.prisma.payslip.create({
      data: {
        userId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        totalHours: data.totalHours || 0,
        basePay,
        overtimePay,
        deductions: taxDeduction,
        netPay,
        status: 'DRAFT',
      },
    });
  }

  async updatePayslipStatus(id: string, status: string) {
    return this.prisma.payslip.update({
      where: { id },
      data: { 
        status,
        ...(status === 'PAID' ? { paidDate: new Date() } : {})
      },
    });
  }
}

