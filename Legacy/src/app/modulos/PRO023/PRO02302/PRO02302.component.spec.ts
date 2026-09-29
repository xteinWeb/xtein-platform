import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02302Component } from './PRO02302.component';

describe('PRO02302Component', () => {
  let component: PRO02302Component;
  let fixture: ComponentFixture<PRO02302Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02302Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02302Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
