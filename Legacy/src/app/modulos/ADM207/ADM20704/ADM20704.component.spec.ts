/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ADM20704Component } from './ADM20704.component';

describe('ADM20704Component', () => {
  let component: ADM20704Component;
  let fixture: ComponentFixture<ADM20704Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ADM20704Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM20704Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
