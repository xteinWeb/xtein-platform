import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM205Component } from './ADM205.component';

describe('ADM205Component', () => {
  let component: ADM205Component;
  let fixture: ComponentFixture<ADM205Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ADM205Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ADM205Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
