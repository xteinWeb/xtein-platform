import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO006Component } from './PRO006.component';

describe('PRO006Component', () => {
  let component: PRO006Component;
  let fixture: ComponentFixture<PRO006Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO006Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO006Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
