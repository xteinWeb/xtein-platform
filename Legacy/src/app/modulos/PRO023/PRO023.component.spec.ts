import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO023Component } from './PRO023.component';

describe('PRO023Component', () => {
  let component: PRO023Component;
  let fixture: ComponentFixture<PRO023Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO023Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO023Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
