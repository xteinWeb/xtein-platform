import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM410Component } from './ADM410.component';

describe('ADM410Component', () => {
  let component: ADM410Component;
  let fixture: ComponentFixture<ADM410Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM410Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM410Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
