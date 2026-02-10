import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MentorCreateEventComponent } from './mentor-create-event';

describe('MentorCreateEventComponent', () => {
  let component: MentorCreateEventComponent;
  let fixture: ComponentFixture<MentorCreateEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentorCreateEventComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MentorCreateEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
