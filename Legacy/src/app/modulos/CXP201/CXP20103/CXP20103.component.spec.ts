import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXP20103Component } from './CXP20103.component';

describe('CXP20103Component', () => {
  let component: CXP20103Component;
  let fixture: ComponentFixture<CXP20103Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXP20103Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXP20103Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
