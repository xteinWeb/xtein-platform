import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO024Component } from './PRO024.component';

describe('PRO024Component', () => {
  let component: PRO024Component;
  let fixture: ComponentFixture<PRO024Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO024Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO024Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
