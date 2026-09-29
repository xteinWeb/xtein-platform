import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM207Component } from './ADM207.component';

describe('ADM207Component', () => {
  let component: ADM207Component;
  let fixture: ComponentFixture<ADM207Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ADM207Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ADM207Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
