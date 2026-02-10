import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MentorReviewSubmissionsComponent } from './mentor-review-submissions';

describe('MentorReviewSubmissionsComponent', () => {
  let component: MentorReviewSubmissionsComponent;
  let fixture: ComponentFixture<MentorReviewSubmissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorReviewSubmissionsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MentorReviewSubmissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
