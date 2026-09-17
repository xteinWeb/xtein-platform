import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO0290201Component } from './PRO0290201.component';

describe('PRO0290201Component', () => {
  let component: PRO0290201Component;
  let fixture: ComponentFixture<PRO0290201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO0290201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO0290201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
