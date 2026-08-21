import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM201Component } from './ADM201.component';

describe('ADM201Component', () => {
  let component: ADM201Component;
  let fixture: ComponentFixture<ADM201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
