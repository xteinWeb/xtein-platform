import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02304Component } from './PRO02304.component';

describe('PRO02304Component', () => {
  let component: PRO02304Component;
  let fixture: ComponentFixture<PRO02304Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02304Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02304Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
