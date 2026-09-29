/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ADM20705Component } from './ADM20705.component';

describe('ADM20705Component', () => {
  let component: ADM20705Component;
  let fixture: ComponentFixture<ADM20705Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ADM20705Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM20705Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
