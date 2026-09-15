/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PRO026Component } from './PRO026.component';

describe('PRO026Component', () => {
  let component: PRO026Component;
  let fixture: ComponentFixture<PRO026Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PRO026Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO026Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
