import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02301Component } from './PRO02301.component';

describe('PRO02301Component', () => {
  let component: PRO02301Component;
  let fixture: ComponentFixture<PRO02301Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02301Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02301Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
