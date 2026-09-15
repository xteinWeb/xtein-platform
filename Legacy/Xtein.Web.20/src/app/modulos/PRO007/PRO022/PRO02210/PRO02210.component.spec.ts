import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02210Component } from './pro02210.component';

describe('PRO02210Component', () => {
  let component: PRO02210Component;
  let fixture: ComponentFixture<PRO02210Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02210Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02210Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
