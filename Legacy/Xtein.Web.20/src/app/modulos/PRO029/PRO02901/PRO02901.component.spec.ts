import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02901Component } from './PRO02901.component';

describe('PRO02901Component', () => {
  let component: PRO02901Component;
  let fixture: ComponentFixture<PRO02901Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02901Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02901Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
