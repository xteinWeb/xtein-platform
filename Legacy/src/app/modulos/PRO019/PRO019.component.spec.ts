import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO019Component } from './PRO019.component';

describe('PRO019Component', () => {
  let component: PRO019Component;
  let fixture: ComponentFixture<PRO019Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO019Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO019Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
