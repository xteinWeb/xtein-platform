import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO033Component } from './PRO033.component';

describe('PRO033Component', () => {
  let component: PRO033Component;
  let fixture: ComponentFixture<PRO033Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO033Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO033Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
