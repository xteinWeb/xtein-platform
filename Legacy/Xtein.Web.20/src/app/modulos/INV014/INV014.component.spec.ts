import { ComponentFixture, TestBed } from '@angular/core/testing';

import { INV014Component } from './inv014.component';

describe('INV014Component', () => {
  let component: INV014Component;
  let fixture: ComponentFixture<INV014Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ INV014Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(INV014Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
