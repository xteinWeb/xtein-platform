import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FemailComponent } from './femail.component';

describe('FemailComponent', () => {
  let component: FemailComponent;
  let fixture: ComponentFixture<FemailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FemailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FemailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
