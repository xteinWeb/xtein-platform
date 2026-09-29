import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO021Component } from './PRO021.component';

describe('PRO021Component', () => {
  let component: PRO021Component;
  let fixture: ComponentFixture<PRO021Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO021Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO021Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
