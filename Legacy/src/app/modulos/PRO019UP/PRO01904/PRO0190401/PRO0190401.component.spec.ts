import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO0190401Component } from './PRO0190401.component';

describe('PRO0190401Component', () => {
  let component: PRO0190401Component;
  let fixture: ComponentFixture<PRO0190401Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO0190401Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO0190401Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
