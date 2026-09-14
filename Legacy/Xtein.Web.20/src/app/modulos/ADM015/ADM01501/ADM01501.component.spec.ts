import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01501Component } from './ADM01501.component';

describe('ADM01501Component', () => {
  let component: ADM01501Component;
  let fixture: ComponentFixture<ADM01501Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM01501Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ADM01501Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
