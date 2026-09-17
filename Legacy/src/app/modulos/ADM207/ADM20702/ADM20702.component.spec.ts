/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ADM20702Component } from './ADM20702.component';

describe('ADM20702Component', () => {
  let component: ADM20702Component;
  let fixture: ComponentFixture<ADM20702Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ADM20702Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM20702Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
