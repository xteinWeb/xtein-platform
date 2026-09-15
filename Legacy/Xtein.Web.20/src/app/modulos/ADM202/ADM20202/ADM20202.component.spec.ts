import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM20202Component } from './ADM20202.component';

describe('ADM20202Component', () => {
  let component: ADM20202Component;
  let fixture: ComponentFixture<ADM20202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM20202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM20202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
