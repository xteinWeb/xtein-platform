import { ComponentFixture, TestBed } from '@angular/core/testing';

import { INV209Component } from './INV209.component';

describe('INV209Component', () => {
  let component: INV209Component;
  let fixture: ComponentFixture<INV209Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ INV209Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(INV209Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
