import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM225Component } from './ADM225.component';

describe('ADM225Component', () => {
  let component: ADM225Component;
  let fixture: ComponentFixture<ADM225Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM225Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM225Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
