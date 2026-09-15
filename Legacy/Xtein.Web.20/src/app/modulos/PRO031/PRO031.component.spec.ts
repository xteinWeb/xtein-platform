import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO031Component } from './PRO031.component';

describe('PRO031Component', () => {
  let component: PRO031Component;
  let fixture: ComponentFixture<PRO031Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO031Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO031Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
