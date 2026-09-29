import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02502Component } from './PRO02502.component';

describe('PRO02502Component', () => {
  let component: PRO02502Component;
  let fixture: ComponentFixture<PRO02502Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02502Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02502Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
