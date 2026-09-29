import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01902_02Component } from './PRO01902_02.component';

describe('PRO01902_02Component', () => {
  let component: PRO01902_02Component;
  let fixture: ComponentFixture<PRO01902_02Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01902_02Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01902_02Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
