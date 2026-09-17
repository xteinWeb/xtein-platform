import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02501Component } from './PRO02501.component';

describe('PRO02501Component', () => {
  let component: PRO02501Component;
  let fixture: ComponentFixture<PRO02501Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02501Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02501Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
