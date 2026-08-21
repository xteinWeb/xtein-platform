import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01505Component } from './ADM01505.component';

describe('ADM01505Component', () => {
  let component: ADM01505Component;
  let fixture: ComponentFixture<ADM01505Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM01505Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM01505Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
