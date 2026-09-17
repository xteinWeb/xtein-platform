import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM015Component } from './ADM015.component';

describe('ADM015Component', () => {
  let component: ADM015Component;
  let fixture: ComponentFixture<ADM015Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM015Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM015Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
