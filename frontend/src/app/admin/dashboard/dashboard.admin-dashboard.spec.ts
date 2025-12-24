import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAdminDashboard } from './dashboard.admin-dashboard';

describe('DashboardAdminDashboard', () => {
  let component: DashboardAdminDashboard;
  let fixture: ComponentFixture<DashboardAdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAdminDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAdminDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
