import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO028Component } from './PRO028.component';

describe('PRO028Component', () => {
  let component: PRO028Component;
  let fixture: ComponentFixture<PRO028Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO028Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO028Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
