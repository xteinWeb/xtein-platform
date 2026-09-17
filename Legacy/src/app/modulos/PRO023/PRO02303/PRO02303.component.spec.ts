import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02303Component } from './PRO02303.component';

describe('PRO02303Component', () => {
  let component: PRO02303Component;
  let fixture: ComponentFixture<PRO02303Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02303Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02303Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
