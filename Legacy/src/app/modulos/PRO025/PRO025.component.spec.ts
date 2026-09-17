import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO025Component } from './PRO025.component';

describe('PRO025Component', () => {
  let component: PRO025Component;
  let fixture: ComponentFixture<PRO025Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO025Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO025Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
