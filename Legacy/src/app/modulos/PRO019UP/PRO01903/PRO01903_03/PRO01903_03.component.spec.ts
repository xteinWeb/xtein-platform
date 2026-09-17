import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO01903_03Component } from './PRO01903_03.component';

describe('PRO01903_03Component', () => {
  let component: PRO01903_03Component;
  let fixture: ComponentFixture<PRO01903_03Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO01903_03Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO01903_03Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
