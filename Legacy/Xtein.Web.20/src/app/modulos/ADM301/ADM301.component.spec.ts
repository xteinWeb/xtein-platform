import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM301Component } from './ADM301.component';

describe('ADM301Component', () => {
  let component: ADM301Component;
  let fixture: ComponentFixture<ADM301Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM301Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM301Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
