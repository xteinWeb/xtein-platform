import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM20201Component } from './ADM20201.component';

describe('ADM20201Component', () => {
  let component: ADM20201Component;
  let fixture: ComponentFixture<ADM20201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM20201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM20201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
