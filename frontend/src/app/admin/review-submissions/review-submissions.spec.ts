import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewSubmissions } from './review-submissions';

describe('ReviewSubmissions', () => {
  let component: ReviewSubmissions;
  let fixture: ComponentFixture<ReviewSubmissions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSubmissions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewSubmissions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
