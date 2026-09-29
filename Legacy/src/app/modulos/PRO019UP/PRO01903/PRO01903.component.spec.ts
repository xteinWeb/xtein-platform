import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01903Component } from './PRO01903.component';

describe('PRO01903Component', () => {
  let component: PRO01903Component;
  let fixture: ComponentFixture<PRO01903Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01903Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01903Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
