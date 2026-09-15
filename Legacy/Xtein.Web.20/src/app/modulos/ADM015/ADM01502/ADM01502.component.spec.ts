import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01502Component } from './ADM01502.component';

describe('ADM01502Component', () => {
  let component: ADM01502Component;
  let fixture: ComponentFixture<ADM01502Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM01502Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM01502Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
