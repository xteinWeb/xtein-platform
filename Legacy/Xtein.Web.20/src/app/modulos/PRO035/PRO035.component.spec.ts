import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO032Component } from './PRO032.component';

describe('PRO032Component', () => {
  let component: PRO032Component;
  let fixture: ComponentFixture<PRO032Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO032Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO032Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
