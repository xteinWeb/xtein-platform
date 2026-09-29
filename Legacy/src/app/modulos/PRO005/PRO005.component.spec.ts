import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO005Component } from './PRO005.component';

describe('PRO005Component', () => {
  let component: PRO005Component;
  let fixture: ComponentFixture<PRO005Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO005Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO005Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
