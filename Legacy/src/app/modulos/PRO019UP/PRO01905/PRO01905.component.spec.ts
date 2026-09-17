import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01905Component } from './PRO01905.component';

describe('PRO01905Component', () => {
  let component: PRO01905Component;
  let fixture: ComponentFixture<PRO01905Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01905Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01905Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
