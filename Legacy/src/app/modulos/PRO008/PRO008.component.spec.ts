import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO008Component } from './PRO008.component';

describe('PRO005Component', () => {
  let component: PRO008Component;
  let fixture: ComponentFixture<PRO008Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO008Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO008Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
