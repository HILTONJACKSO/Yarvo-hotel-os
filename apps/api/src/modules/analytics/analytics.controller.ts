import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get main dashboard aggregates' })
  async getDashboard() {
    const data = await this.analyticsService.getDashboardMetrics();
    return { data };
  }

  @Get('revenue-chart')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get revenue charting data for the last 7 days' })
  async getRevenueChart() {
    const data = await this.analyticsService.getRevenueChart();
    return { data };
  }

  @Get('fb-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbMetrics() {
    const data = await this.analyticsService.getFbMetrics();
    return { data };
  }

  @Get('fb-chart')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbChart() {
    const data = await this.analyticsService.getFbRevenueChart();
    return { data };
  }

  @Get('fb-top-items')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbTopItems() {
    const data = await this.analyticsService.getFbTopItems();
    return { data };
  }

  @Get('revenue-by-method')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getRevenueByMethod() {
    const data = await this.analyticsService.getRevenueByMethod();
    return { data };
  }

  @Get('occupancy-heatmap')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  async getOccupancyHeatmap() {
    const data = await this.analyticsService.getOccupancyHeatmap();
    return { data };
  }

  @Get('recent-activity')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK')
  async getRecentActivity() {
    const data = await this.analyticsService.getRecentActivity();
    return { data };
  }

  // --- Financial Reports ---

  @Get('reports/pnl')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Profit & Loss statement' })
  async getProfitAndLoss() {
    const data = await this.analyticsService.getProfitAndLoss();
    return { data };
  }

  @Get('reports/trial-balance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Trial Balance' })
  async getTrialBalance() {
    const data = await this.analyticsService.getTrialBalance();
    return { data };
  }

  @Get('reports/balance-sheet')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  async getBalanceSheet() {
    const data = await this.analyticsService.getBalanceSheet();
    return { data };
  }
}

