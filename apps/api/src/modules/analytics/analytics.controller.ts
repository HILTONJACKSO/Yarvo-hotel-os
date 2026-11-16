import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  @ApiOperation({ summary: 'Get main dashboard aggregates' })
  async getDashboard(@CurrentUser() user: any) {
    const data = await this.analyticsService.getDashboardMetrics(user?.propertyId);
    return { data };
  }

  @Get('hotel-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get hotel room sales and performance metrics' })
  async getHotelMetrics(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('propertyId') propId?: string,
  ) {
    const data = await this.analyticsService.getHotelMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('revenue-chart')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get revenue charting data for the last 7 days' })
  async getRevenueChart(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getRevenueChart(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('fb-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbMetrics(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getFbMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('fb-chart')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbChart(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getFbRevenueChart(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('fb-top-items')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getFbTopItems(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getFbTopItems(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('boutique-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get Boutique sales metrics and top items' })
  async getBoutiqueMetrics(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('propertyId') propId?: string,
  ) {
    const data = await this.analyticsService.getBoutiqueMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('activities-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  @ApiOperation({ summary: 'Get Activities, Tours, and Packages revenue metrics' })
  async getActivitiesMetrics(
    @CurrentUser() user: any,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('propertyId') propId?: string,
  ) {
    const data = await this.analyticsService.getActivitiesMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('revenue-by-method')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'CASHIER', 'FRONT_DESK')
  async getRevenueByMethod(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getRevenueByMethod(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('occupancy-heatmap')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  async getOccupancyHeatmap(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getOccupancyHeatmap(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('recent-activity')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'FRONT_DESK', 'ACCOUNTANT', 'CASHIER')
  async getRecentActivity(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getRecentActivity(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('tickets-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'FRONT_DESK', 'CASHIER')
  async getTicketsMetrics(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getTicketsMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('events-metrics')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT', 'FRONT_DESK', 'CASHIER')
  async getEventsMetrics(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getEventsMetrics(start, end, propId || user?.propertyId);
    return { data };
  }

  // --- Financial Reports ---

  @Get('reports/pnl')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Profit & Loss statement' })
  async getProfitAndLoss(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getProfitAndLoss(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('reports/trial-balance')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Trial Balance' })
  async getTrialBalance(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getTrialBalance(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('reports/balance-sheet')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  async getBalanceSheet(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getBalanceSheet(start, end, propId || user?.propertyId);
    return { data };
  }

  @Get('discounts')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get discounts from folios and POS' })
  async getDiscounts(@CurrentUser() user: any, @Query('start') start?: string, @Query('end') end?: string, @Query('propertyId') propId?: string) {
    const data = await this.analyticsService.getDiscounts(start, end, propId || user?.propertyId);
    return { data };
  }
}
