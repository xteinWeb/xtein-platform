import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01504Component } from './ADM01504.component';

describe('ADM01504Component', () => {
  let component: ADM01504Component;
  let fixture: ComponentFixture<ADM01504Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM01504Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM01504Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
