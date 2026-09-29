/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CXP20104Component } from './CXP20104.component';

describe('CXP20104Component', () => {
  let component: CXP20104Component;
  let fixture: ComponentFixture<CXP20104Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CXP20104Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CXP20104Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
