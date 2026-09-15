import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM212Component } from './ADM212.component';

describe('ADM212Component', () => {
  let component: ADM212Component;
  let fixture: ComponentFixture<ADM212Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM212Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM212Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
