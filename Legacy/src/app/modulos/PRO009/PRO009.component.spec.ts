import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO009Component } from './PRO009.component';

describe('PRO009Component', () => {
  let component: PRO009Component;
  let fixture: ComponentFixture<PRO009Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO009Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO009Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
