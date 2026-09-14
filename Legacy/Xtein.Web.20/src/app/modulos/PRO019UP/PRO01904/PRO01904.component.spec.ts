import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01904Component } from './PRO01904.component';

describe('PRO01904Component', () => {
  let component: PRO01904Component;
  let fixture: ComponentFixture<PRO01904Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01904Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01904Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
