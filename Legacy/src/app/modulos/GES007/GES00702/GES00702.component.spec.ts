import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00702Component } from './GES00702.component';

describe('GES00702Component', () => {
  let component: GES00702Component;
  let fixture: ComponentFixture<GES00702Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00702Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00702Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
