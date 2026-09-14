import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02904Component } from './PRO02904.component';

describe('PRO02904Component', () => {
  let component: PRO02904Component;
  let fixture: ComponentFixture<PRO02904Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02904Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02904Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
