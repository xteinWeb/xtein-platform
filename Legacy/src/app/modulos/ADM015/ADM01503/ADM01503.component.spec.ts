import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01503Component } from './ADM01503.component';

describe('ADM01503Component', () => {
  let component: ADM01503Component;
  let fixture: ComponentFixture<ADM01503Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM01503Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM01503Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
