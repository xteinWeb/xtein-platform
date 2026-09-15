import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO027Component } from './PRO027.component';

describe('PRO027Component', () => {
  let component: PRO027Component;
  let fixture: ComponentFixture<PRO027Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO027Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO027Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
