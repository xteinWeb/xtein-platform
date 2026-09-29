import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00102Component } from './GES00102.component';

describe('GES00102Component', () => {
  let component: GES00102Component;
  let fixture: ComponentFixture<GES00102Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00102Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00102Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
