/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ADM20703Component } from './ADM20703.component';

describe('ADM20703Component', () => {
  let component: ADM20703Component;
  let fixture: ComponentFixture<ADM20703Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ADM20703Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM20703Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
