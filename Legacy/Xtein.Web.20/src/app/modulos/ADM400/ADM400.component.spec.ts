import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM400Component } from './ADM400.component';

describe('ADM400Component', () => {
  let component: ADM400Component;
  let fixture: ComponentFixture<ADM400Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM400Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM400Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
