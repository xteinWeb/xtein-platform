import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01901Component } from './PRO01901.component';

describe('PRO01901Component', () => {
  let component: PRO01901Component;
  let fixture: ComponentFixture<PRO01901Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01901Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01901Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
