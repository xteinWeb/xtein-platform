import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO029Component } from './PRO029.component';

describe('PRO029Component', () => {
  let component: PRO029Component;
  let fixture: ComponentFixture<PRO029Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO029Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO029Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
