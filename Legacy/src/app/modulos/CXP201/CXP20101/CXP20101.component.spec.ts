import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXP20101Component } from './CXP20101.component';

describe('CXP20101Component', () => {
  let component: CXP20101Component;
  let fixture: ComponentFixture<CXP20101Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXP20101Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXP20101Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
