import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AttendanceSession {
  clockIn: string;
  clockOut?: string | null;
  actionType?: string;
}

export interface AttendanceActionLog {
  type: string;
  time: string;
  reason?: string;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy?: string;
  requestedBy?: string;
}

export interface AttendancePendingRequest {
  type: string;
  requestedAt: string;
  time: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface AttendanceMeta {
  __isAttendanceMeta: true;
  sessions: AttendanceSession[];
  currentAction: string;
  actionHistory: AttendanceActionLog[];
  pendingRequest?: AttendancePendingRequest | null;
  noteText?: string;
}

const APPROVAL_REQUIRED_ACTIONS = [
  'FROM_BREAK',
  'EMERGENCY',
  'LEAVE_WITHOUT_EXCUSE',
  'LEAVE_WITH_EXCUSE',
];

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private isSupervisorOrAbove(reqUser?: any): boolean {
    if (!reqUser?.roles || !Array.isArray(reqUser.roles)) return false;
    return reqUser.roles.some((r: any) =>
      ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'SUPERVISOR'].includes(
        (typeof r === 'string' ? r : r?.name || '').toUpperCase(),
      ),
    );
  }

  private getApproverLabel(reqUser?: any): string {
    if (!reqUser) return 'Management';
    const name = [reqUser.firstName, reqUser.lastName].filter(Boolean).join(' ').trim();
    const role = Array.isArray(reqUser.roles) && reqUser.roles.length > 0
      ? (typeof reqUser.roles[0] === 'string' ? reqUser.roles[0] : reqUser.roles[0]?.name || '')
      : '';
    return name ? `${name}${role ? ` (${role})` : ''}` : role || 'Supervisor/Manager';
  }

  private parseAttendanceMeta(record: any): AttendanceMeta {
    if (record?.notes && typeof record.notes === 'string') {
      try {
        const parsed = JSON.parse(record.notes);
        if (parsed && parsed.__isAttendanceMeta) {
          return parsed as AttendanceMeta;
        }
      } catch {
        // Legacy plain-text notes
      }
    }
    return {
      __isAttendanceMeta: true,
      sessions: record?.clockIn
        ? [
            {
              clockIn: new Date(record.clockIn).toISOString(),
              clockOut: record.clockOut ? new Date(record.clockOut).toISOString() : null,
              actionType: 'CLOCK_IN',
            },
          ]
        : [],
      currentAction: record?.clockOut ? 'CLOCK_OUT' : 'CLOCK_IN',
      actionHistory: [],
      pendingRequest: null,
      noteText: typeof record?.notes === 'string' ? record.notes : '',
    };
  }

  private enrichAttendance(record: any) {
    const meta = this.parseAttendanceMeta(record);
    const nowMs = Date.now();
    let totalMs = 0;

    if (Array.isArray(meta.sessions) && meta.sessions.length > 0) {
      for (const s of meta.sessions) {
        const startMs = new Date(s.clockIn).getTime();
        if (isNaN(startMs)) continue;
        const endMs = s.clockOut
          ? new Date(s.clockOut).getTime()
          : meta.currentAction === 'CLOCK_IN' || meta.currentAction === 'FROM_BREAK'
            ? nowMs
            : startMs;
        if (!isNaN(endMs) && endMs > startMs) {
          totalMs += endMs - startMs;
        }
      }
    } else if (record.clockIn) {
      const startMs = new Date(record.clockIn).getTime();
      const endMs = record.clockOut ? new Date(record.clockOut).getTime() : nowMs;
      if (endMs > startMs) totalMs = endMs - startMs;
    }

    const totalWorkedHours = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;
    const regularHours = Math.round(Math.min(8, totalWorkedHours) * 100) / 100;
    // Extra time rule: only counted if worked > 8 hours AND extra time is >= 1 hour
    const excessHours = totalWorkedHours - 8;
    const extraTimeHours = excessHours >= 1 ? Math.round(excessHours * 100) / 100 : 0;

    return {
      ...record,
      meta,
      totalWorkedHours,
      regularHours,
      extraTimeHours,
    };
  }

  private resolveDateTime(dateStr?: string, timeOrIso?: string): Date {
    if (timeOrIso) {
      if (timeOrIso.includes('T')) {
        const parsed = new Date(timeOrIso);
        if (!isNaN(parsed.getTime())) return parsed;
      }
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeOrIso)) {
        const baseDate = dateStr || new Date().toISOString().split('T')[0];
        const timePart = timeOrIso.length === 5 ? `${timeOrIso}:00` : timeOrIso;
        const localDate = new Date(`${baseDate}T${timePart}`);
        if (!isNaN(localDate.getTime())) return localDate;
      }
    }
    return new Date();
  }

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

  async getShifts(
    date?: string,
    startDate?: string,
    endDate?: string,
    department?: string,
    userId?: string,
  ) {
    const where: any = {};

    if (startDate && endDate) {
      const start = new Date(`${startDate.split('T')[0]}T00:00:00.000Z`);
      const end = new Date(`${endDate.split('T')[0]}T23:59:59.999Z`);
      where.OR = [
        { date: { gte: start, lte: end } },
        { startTime: { lte: end }, endTime: { gte: start } },
      ];
    } else if (date) {
      const dayStart = new Date(`${date.split('T')[0]}T00:00:00.000Z`);
      const dayEnd = new Date(`${date.split('T')[0]}T23:59:59.999Z`);
      where.OR = [
        { date: new Date(date.split('T')[0]) },
        { startTime: { lte: dayEnd }, endTime: { gte: dayStart } },
      ];
    }

    if (department && department !== 'ALL') {
      where.department = { contains: department, mode: 'insensitive' };
    }
    if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    return this.prisma.shift.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: {
          include: {
            roles: true,
            staffProfile: true,
          },
        },
        attendances: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
  }

  async createShift(data: any) {
    const startDateStr = (data.startDate || data.date || new Date().toISOString()).split('T')[0];
    return this.prisma.shift.create({
      data: {
        userId: data.userId,
        date: new Date(startDateStr),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        department: data.department,
        status: data.status || 'SCHEDULED',
      },
      include: {
        user: {
          include: {
            roles: true,
            staffProfile: true,
          },
        },
      },
    });
  }

  async updateShift(id: string, data: any) {
    const startDateStr = data.startDate || data.date;
    return this.prisma.shift.update({
      where: { id },
      data: {
        ...(data.userId ? { userId: data.userId } : {}),
        ...(startDateStr ? { date: new Date(startDateStr.split('T')[0]) } : {}),
        ...(data.startTime ? { startTime: new Date(data.startTime) } : {}),
        ...(data.endTime ? { endTime: new Date(data.endTime) } : {}),
        ...(data.department !== undefined ? { department: data.department } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: {
        user: {
          include: {
            roles: true,
            staffProfile: true,
          },
        },
      },
    });
  }

  async deleteShift(id: string) {
    return this.prisma.shift.delete({ where: { id } });
  }

  // ─── ATTENDANCE ─────────────────────────────────────────────────────────────

  async getAttendances(date?: string, userId?: string) {
    const where: any = {};
    if (date) where.date = new Date(date.split('T')[0]);
    if (userId) where.userId = userId;

    const list = await this.prisma.attendance.findMany({
      where,
      include: {
        user: {
          include: {
            roles: true,
            staffProfile: true,
          },
        },
        shift: true,
      },
      orderBy: { clockIn: 'desc' },
    });

    return list.map((r) => this.enrichAttendance(r));
  }

  async clockIn(data: any, reqUser?: any) {
    const effectiveTime = this.resolveDateTime(data.date, data.clockInTime || data.time);
    const dateStr = (data.date || effectiveTime.toISOString()).split('T')[0];
    const actionType = (data.actionType || 'CLOCK_IN').toUpperCase();
    const requiresApproval = APPROVAL_REQUIRED_ACTIONS.includes(actionType);
    const isSupervisor = this.isSupervisorOrAbove(reqUser);
    const approvalStatus: 'APPROVED' | 'PENDING' =
      !requiresApproval || isSupervisor ? 'APPROVED' : 'PENDING';

    // Check if staff already has an attendance record for this date (e.g. returning from break/emergency)
    const existing = await this.prisma.attendance.findFirst({
      where: {
        userId: data.userId,
        date: new Date(dateStr),
      },
      orderBy: { clockIn: 'desc' },
    });

    if (existing) {
      const meta = this.parseAttendanceMeta(existing);
      // Close any unclosed session before starting/resuming
      const lastSession = meta.sessions[meta.sessions.length - 1];
      if (lastSession && !lastSession.clockOut) {
        if (actionType === 'BREAK' || actionType === 'EMERGENCY' || actionType.startsWith('LEAVE_') || actionType === 'CLOCK_OUT') {
          return this.clockOut(
            existing.id,
            {
              actionType,
              clockOutTime: effectiveTime.toISOString(),
              notes: data.notes || data.reason,
            },
            reqUser,
          );
        }
      } else {
        // Resuming work (From Break / Emergency return / re-clock in)
        meta.sessions.push({
          clockIn: effectiveTime.toISOString(),
          clockOut: null,
          actionType: actionType === 'CLOCK_IN' ? 'FROM_BREAK' : actionType,
        });
      }

      meta.currentAction = actionType === 'CLOCK_IN' && meta.sessions.length > 1 ? 'FROM_BREAK' : actionType;
      meta.actionHistory.push({
        type: meta.currentAction,
        time: effectiveTime.toISOString(),
        reason: data.notes || data.reason || '',
        approvalStatus,
        approvedBy: approvalStatus === 'APPROVED' && requiresApproval ? this.getApproverLabel(reqUser) : undefined,
      });

      if (requiresApproval && approvalStatus === 'PENDING') {
        meta.pendingRequest = {
          type: meta.currentAction,
          requestedAt: new Date().toISOString(),
          time: effectiveTime.toISOString(),
          reason: data.notes || data.reason || '',
          status: 'PENDING',
        };
      } else if (requiresApproval && approvalStatus === 'APPROVED') {
        meta.pendingRequest = {
          type: meta.currentAction,
          requestedAt: new Date().toISOString(),
          time: effectiveTime.toISOString(),
          reason: data.notes || data.reason || '',
          status: 'APPROVED',
          approvedBy: this.getApproverLabel(reqUser),
          approvedAt: new Date().toISOString(),
        };
      }

      if (data.notes) meta.noteText = data.notes;

      const updated = await this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          clockOut: null,
          status: meta.currentAction === 'FROM_BREAK' ? 'FROM_BREAK' : 'PRESENT',
          notes: JSON.stringify(meta),
        },
        include: { user: { include: { roles: true, staffProfile: true } }, shift: true },
      });

      return this.enrichAttendance(updated);
    }

    // Creating a new daily attendance record
    const isPauseOrLeaveAction = ['BREAK', 'EMERGENCY', 'LEAVE_WITHOUT_EXCUSE', 'LEAVE_WITH_EXCUSE'].includes(actionType);
    const meta: AttendanceMeta = {
      __isAttendanceMeta: true,
      sessions: isPauseOrLeaveAction
        ? []
        : [
            {
              clockIn: effectiveTime.toISOString(),
              clockOut: null,
              actionType,
            },
          ],
      currentAction: actionType,
      actionHistory: [
        {
          type: actionType,
          time: effectiveTime.toISOString(),
          reason: data.notes || data.reason || '',
          approvalStatus,
          approvedBy: approvalStatus === 'APPROVED' && requiresApproval ? this.getApproverLabel(reqUser) : undefined,
        },
      ],
      pendingRequest: requiresApproval
        ? {
            type: actionType,
            requestedAt: new Date().toISOString(),
            time: effectiveTime.toISOString(),
            reason: data.notes || data.reason || '',
            status: approvalStatus,
            approvedBy: approvalStatus === 'APPROVED' ? this.getApproverLabel(reqUser) : undefined,
            approvedAt: approvalStatus === 'APPROVED' ? new Date().toISOString() : undefined,
          }
        : null,
      noteText: data.notes || data.reason || '',
    };

    const statusLabel =
      actionType === 'BREAK'
        ? 'ON_BREAK'
        : actionType === 'FROM_BREAK'
          ? 'FROM_BREAK'
          : actionType === 'EMERGENCY'
            ? 'EMERGENCY'
            : actionType === 'LEAVE_WITH_EXCUSE'
              ? 'LEAVE_WITH_EXCUSE'
              : actionType === 'LEAVE_WITHOUT_EXCUSE'
                ? 'LEAVE_WITHOUT_EXCUSE'
                : data.status || 'PRESENT';

    const created = await this.prisma.attendance.create({
      data: {
        userId: data.userId,
        shiftId: data.shiftId,
        date: new Date(dateStr),
        clockIn: effectiveTime,
        clockOut: actionType.startsWith('LEAVE_') ? effectiveTime : null,
        status: statusLabel,
        notes: JSON.stringify(meta),
      },
      include: { user: { include: { roles: true, staffProfile: true } }, shift: true },
    });

    return this.enrichAttendance(created);
  }

  async clockOut(id: string, data?: any, reqUser?: any) {
    const existing = await this.prisma.attendance.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!existing) throw new NotFoundException('Attendance record not found');

    const payload = typeof data === 'string' ? { notes: data } : data || {};
    const actionType = (payload.actionType || 'CLOCK_OUT').toUpperCase();
    const dateStr = existing.date.toISOString().split('T')[0];
    const effectiveTime = this.resolveDateTime(dateStr, payload.clockOutTime || payload.time);

    const meta = this.parseAttendanceMeta(existing);
    const requiresApproval = APPROVAL_REQUIRED_ACTIONS.includes(actionType);
    const isSupervisor = this.isSupervisorOrAbove(reqUser);
    const approvalStatus: 'APPROVED' | 'PENDING' =
      !requiresApproval || isSupervisor ? 'APPROVED' : 'PENDING';

    if (actionType === 'FROM_BREAK' || actionType === 'CLOCK_IN') {
      // Resume daily work on the same record
      const lastSession = meta.sessions[meta.sessions.length - 1];
      if (!lastSession || lastSession.clockOut) {
        meta.sessions.push({
          clockIn: effectiveTime.toISOString(),
          clockOut: null,
          actionType: 'FROM_BREAK',
        });
      }
      meta.currentAction = 'FROM_BREAK';
    } else {
      // Close open session for BREAK, EMERGENCY, LEAVE_*, or CLOCK_OUT
      const lastSession = meta.sessions[meta.sessions.length - 1];
      if (lastSession && !lastSession.clockOut) {
        lastSession.clockOut = effectiveTime.toISOString();
      } else if (meta.sessions.length === 0 && existing.clockIn) {
        meta.sessions.push({
          clockIn: existing.clockIn.toISOString(),
          clockOut: effectiveTime.toISOString(),
          actionType: 'CLOCK_IN',
        });
      }
      meta.currentAction = actionType;
    }

    meta.actionHistory.push({
      type: actionType,
      time: effectiveTime.toISOString(),
      reason: payload.notes || payload.reason || '',
      approvalStatus,
      approvedBy: approvalStatus === 'APPROVED' && requiresApproval ? this.getApproverLabel(reqUser) : undefined,
    });

    if (requiresApproval) {
      meta.pendingRequest = {
        type: actionType,
        requestedAt: new Date().toISOString(),
        time: effectiveTime.toISOString(),
        reason: payload.notes || payload.reason || '',
        status: approvalStatus,
        approvedBy: approvalStatus === 'APPROVED' ? this.getApproverLabel(reqUser) : undefined,
        approvedAt: approvalStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      };
    }

    if (payload.notes || payload.reason) {
      meta.noteText = payload.notes || payload.reason;
    }

    const isStillResumable = actionType === 'BREAK' || actionType === 'FROM_BREAK' || actionType === 'CLOCK_IN';
    const nextStatus =
      actionType === 'BREAK'
        ? 'ON_BREAK'
        : actionType === 'FROM_BREAK' || actionType === 'CLOCK_IN'
          ? 'FROM_BREAK'
          : actionType === 'EMERGENCY'
            ? 'EMERGENCY'
            : actionType === 'LEAVE_WITH_EXCUSE'
              ? 'LEAVE_WITH_EXCUSE'
              : actionType === 'LEAVE_WITHOUT_EXCUSE'
                ? 'LEAVE_WITHOUT_EXCUSE'
                : 'PRESENT';

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        clockOut: isStillResumable ? null : effectiveTime,
        status: nextStatus,
        notes: JSON.stringify(meta),
      },
      include: { user: { include: { roles: true, staffProfile: true } }, shift: true },
    });

    return this.enrichAttendance(updated);
  }

  async approveAttendanceRequest(
    id: string,
    data: { approved: boolean; note?: string },
    reqUser?: any,
  ) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Attendance record not found');

    const meta = this.parseAttendanceMeta(existing);
    const approverLabel = this.getApproverLabel(reqUser);
    const decisionStatus = data.approved ? 'APPROVED' : 'REJECTED';

    if (meta.pendingRequest) {
      meta.pendingRequest.status = decisionStatus;
      meta.pendingRequest.approvedBy = approverLabel;
      meta.pendingRequest.approvedAt = new Date().toISOString();
      if (data.note) {
        meta.pendingRequest.reason = [meta.pendingRequest.reason, `Management Note: ${data.note}`]
          .filter(Boolean)
          .join(' | ');
      }
    }

    for (let i = meta.actionHistory.length - 1; i >= 0; i--) {
      if (meta.actionHistory[i].approvalStatus === 'PENDING') {
        meta.actionHistory[i].approvalStatus = decisionStatus;
        meta.actionHistory[i].approvedBy = approverLabel;
        break;
      }
    }

    const updated = await this.prisma.attendance.update({
      where: { id },
      data: {
        notes: JSON.stringify(meta),
      },
      include: { user: { include: { roles: true, staffProfile: true } }, shift: true },
    });

    return this.enrichAttendance(updated);
  }

  // ─── PAYROLL ────────────────────────────────────────────────────────────────

  async getPayslips(periodStart?: string, periodEnd?: string, userId?: string) {
    const where: any = {};
    if (periodStart && periodEnd) {
      where.periodStart = { gte: new Date(periodStart) };
      where.periodEnd = { lte: new Date(periodEnd) };
    }
    if (userId) {
      where.userId = userId;
    }
    return this.prisma.payslip.findMany({
      where,
      include: { user: true },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getPayrollStats() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const payslips = await this.prisma.payslip.findMany({
      where: {
        periodStart: { gte: twelveMonthsAgo },
      },
    });

    const monthlyData: Record<string, number> = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toISOString().slice(0, 7);
      monthlyData[monthStr] = 0;
    }

    payslips.forEach((ps) => {
      const monthStr = ps.periodStart.toISOString().slice(0, 7);
      if (monthlyData[monthStr] !== undefined) {
        monthlyData[monthStr] += Number(ps.netPay);
      }
    });

    return Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total,
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
    const basePay = Number(data.basePay || 0);
    const overtimePay = Number(data.overtimePay || 0);
    const bonus = Number(data.bonus || 0);
    const grossSalary = basePay + overtimePay + bonus;

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

    const paidDays =
      workedDays +
      holidayWorkedDays +
      leaveDays +
      sickJustifyDays +
      bereavedDays +
      maternityPaternityDays +
      excusePaidDays;
    const attendancePercent = targetDays > 0 ? (paidDays / targetDays) * 100 : 0;

    const advance = Number(data.advance || 0);
    const penalty = Number(data.penalty || 0);
    const loanPayback = Number(data.loanPayback || 0);
    const unionDues = Number(data.unionDues || 0);
    const nasscorp = Number(data.nasscorp || 0);
    const withholdingTax = Number(data.withholdingTax || 0);

    const totalDeductions = advance + penalty + loanPayback + unionDues + nasscorp + withholdingTax;
    const netPay = grossSalary - totalDeductions;

    return this.prisma.payslip.update({
      where: { id },
      data: {
        basePay,
        overtimePay,
        bonus,
        grossSalary,
        targetDays,
        workedDays,
        extraDays,
        holidayWorkedDays,
        leaveDays,
        sickNoJustifyDays,
        sickJustifyDays,
        bereavedDays,
        maternityPaternityDays,
        excusePaidDays,
        excuseNoPayDays,
        absentDays,
        attendancePercent,
        advance,
        penalty,
        loanPayback,
        unionDues,
        nasscorp,
        withholdingTax,
        deductions: totalDeductions,
        netPay,
        rateLd: Number(data.rateLd || 199.86),
      },
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

    payslips.forEach((ps) => {
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
      totalSalary,
      totalAdvance,
      totalPenalty,
      totalLoanPayback,
      totalUnion,
      totalNasscorp,
      totalWithholding,
      totalDeductions,
      totalGrossWages,
      totalBalance,
      totalDaysWork,
      totalExtraDays,
      totalAbsent,
      totalWorkHoliday,
    };
  }

  async updatePayslipStatus(id: string, status: string) {
    return this.prisma.payslip.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' ? { paidDate: new Date() } : {}),
      },
    });
  }
}
