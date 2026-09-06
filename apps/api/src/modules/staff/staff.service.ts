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

  async getPayslips(periodStart?: string, periodEnd?: string) {
    const where: any = {};
    if (periodStart && periodEnd) {
      where.periodStart = { gte: new Date(periodStart) };
      where.periodEnd = { lte: new Date(periodEnd) };
    }
    return this.prisma.payslip.findMany({
      where,
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
    return this.prisma.payslip.create({
      data: {
        userId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        status: 'DRAFT',
      },
    });
  }

  async updatePayslip(id: string, data: any) {
    // 1. Calculate Gross
    const basePay = Number(data.basePay || 0);
    const overtimePay = Number(data.overtimePay || 0);
    const bonus = Number(data.bonus || 0);
    const grossSalary = basePay + overtimePay + bonus;

    // 2. Attendance %
    const targetDays = Number(data.targetDays || 25);
    const workedDays = Number(data.workedDays || 0);
    const extraDays = Number(data.extraDays || 0);
    const holidayWorkedDays = Number(data.holidayWorkedDays || 0);
    const leaveDays = Number(data.leaveDays || 0);
    const sickNoJustifyDays = Number(data.sickNoJustifyDays || 0);
    const sickJustifyDays = Number(data.sickJustifyDays || 0);
    const bereavedDays = Number(data.bereavedDays || 0);
    const maternityPaternityDays = Number(data.maternityPaternityDays || 0);
    const excusePaidDays = Number(data.excusePaidDays || 0);
    const excuseNoPayDays = Number(data.excuseNoPayDays || 0);
    const absentDays = Number(data.absentDays || 0);

    const paidDays = workedDays + holidayWorkedDays + leaveDays + sickJustifyDays + bereavedDays + maternityPaternityDays + excusePaidDays;
    const attendancePercent = targetDays > 0 ? (paidDays / targetDays) * 100 : 0;

    // 3. Deductions
    const advance = Number(data.advance || 0);
    const penalty = Number(data.penalty || 0);
    const loanPayback = Number(data.loanPayback || 0);
    const unionDues = Number(data.unionDues || 0);
    const nasscorp = Number(data.nasscorp || 0);
    const withholdingTax = Number(data.withholdingTax || 0);

    const totalDeductions = advance + penalty + loanPayback + unionDues + nasscorp + withholdingTax;

    // 4. Net Pay (Balance Salary)
    const netPay = grossSalary - totalDeductions;

    return this.prisma.payslip.update({
      where: { id },
      data: {
        basePay, overtimePay, bonus, grossSalary,
        targetDays, workedDays, extraDays, holidayWorkedDays, leaveDays, sickNoJustifyDays, sickJustifyDays, bereavedDays, maternityPaternityDays, excusePaidDays, excuseNoPayDays, absentDays, attendancePercent,
        advance, penalty, loanPayback, unionDues, nasscorp, withholdingTax, deductions: totalDeductions,
        netPay,
        rateLd: Number(data.rateLd || 199.86)
      }
    });
  }

  async getPayrollSummary(periodStart: string, periodEnd: string) {
    const payslips = await this.getPayslips(periodStart, periodEnd);
    
    let totalSalary = 0;
    let totalAdvance = 0;
    let totalPenalty = 0;
    let totalLoanPayback = 0;
    let totalUnion = 0;
    let totalNasscorp = 0;
    let totalWithholding = 0;
    let totalDeductions = 0;
    let totalGrossWages = 0;
    let totalBalance = 0;
    let totalDaysWork = 0;
    let totalExtraDays = 0;
    let totalAbsent = 0;
    let totalWorkHoliday = 0;

    payslips.forEach(ps => {
      totalSalary += Number(ps.basePay);
      totalAdvance += Number(ps.advance);
      totalPenalty += Number(ps.penalty);
      totalLoanPayback += Number(ps.loanPayback);
      totalUnion += Number(ps.unionDues);
      totalNasscorp += Number(ps.nasscorp);
      totalWithholding += Number(ps.withholdingTax);
      totalDeductions += Number(ps.deductions);
      totalGrossWages += Number(ps.grossSalary);
      totalBalance += Number(ps.netPay);
      totalDaysWork += Number(ps.workedDays);
      totalExtraDays += Number(ps.extraDays);
      totalAbsent += Number(ps.absentDays);
      totalWorkHoliday += Number(ps.holidayWorkedDays);
    });

    return {
      totalSalary, totalAdvance, totalPenalty, totalLoanPayback, totalUnion, totalNasscorp, totalWithholding, totalDeductions, totalGrossWages, totalBalance, totalDaysWork, totalExtraDays, totalAbsent, totalWorkHoliday
    };
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

