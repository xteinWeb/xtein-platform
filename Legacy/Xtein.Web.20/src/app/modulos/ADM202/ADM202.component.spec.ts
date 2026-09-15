import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM202Component } from './ADM202.component';

describe('ADM202Component', () => {
  let component: ADM202Component;
  let fixture: ComponentFixture<ADM202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
