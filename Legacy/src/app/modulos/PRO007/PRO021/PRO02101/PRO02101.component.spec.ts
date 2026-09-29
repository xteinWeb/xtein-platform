import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02101Component } from './PRO02101.component';

describe('PRO02101Component', () => {
  let component: PRO02101Component;
  let fixture: ComponentFixture<PRO02101Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02101Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO02101Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
