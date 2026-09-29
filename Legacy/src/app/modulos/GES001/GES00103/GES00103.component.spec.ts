import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00103Component } from './GES00103.component';

describe('GES00103Component', () => {
  let component: GES00103Component;
  let fixture: ComponentFixture<GES00103Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00103Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00103Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
