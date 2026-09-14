import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO03201Component } from './pro03201.component';

describe('PRO03201Component', () => {
  let component: PRO03201Component;
  let fixture: ComponentFixture<PRO03201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO03201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO03201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
