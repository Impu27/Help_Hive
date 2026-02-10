import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageMentorsComponent } from './manage-mentors';

describe('ManageMentorsComponent', () => {
  let component: ManageMentorsComponent;
  let fixture: ComponentFixture<ManageMentorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageMentorsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageMentorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
