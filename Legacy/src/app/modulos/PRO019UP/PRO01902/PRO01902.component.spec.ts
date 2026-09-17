import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01902Component } from './PRO01902.component';

describe('PRO01902Component', () => {
  let component: PRO01902Component;
  let fixture: ComponentFixture<PRO01902Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01902Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01902Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
