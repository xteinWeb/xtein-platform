import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00100Component } from './GES00100.component';

describe('GES00100Component', () => {
  let component: GES00100Component;
  let fixture: ComponentFixture<GES00100Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00100Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00100Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
