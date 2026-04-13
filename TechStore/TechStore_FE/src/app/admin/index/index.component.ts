import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../Service/dashboard.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  totalUsers: number = 0;
  totalOrders: number = 0;
  totalProducts: number = 0;
  totalRevenue: number = 0;
  maxRevenue: number = 0;

  monthlyRevenueLabels: string[] = [];
  monthlyRevenueData: number[] = [];


  constructor(private dashboardService: DashboardService) { }

  async ngOnInit(): Promise<void> {
  await this.loadDashboardStats();
  await this.loadMonthlyRevenueChart();
}

  async loadDashboardStats() {
  const data = await firstValueFrom(this.dashboardService.getDashboardData());
  this.totalUsers = data.totalUsers;
  this.totalOrders = data.totalOrders;
  this.totalProducts = data.totalProducts;
  this.totalRevenue = data.totalRevenue;
}

async loadMonthlyRevenueChart() {
  const data = await firstValueFrom(this.dashboardService.getMonthlyRevenue());
  this.monthlyRevenueLabels = data.map((x: any) => x.Month);
  this.monthlyRevenueData = data.map((x: any) => x.TotalRevenue);
  this.maxRevenue = Math.max(...this.monthlyRevenueData);
}

  getBarHeight(value: number): number {
    return this.maxRevenue ? (value / this.maxRevenue) * 100 : 0;
  }
}
