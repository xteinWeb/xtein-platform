import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02300Component } from './PRO02300.component';

describe('PRO02300Component', () => {
  let component: PRO02300Component;
  let fixture: ComponentFixture<PRO02300Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02300Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02300Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
