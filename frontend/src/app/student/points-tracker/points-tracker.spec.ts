import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointsTracker } from './points-tracker';

describe('PointsTracker', () => {
  let component: PointsTracker;
  let fixture: ComponentFixture<PointsTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointsTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointsTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
