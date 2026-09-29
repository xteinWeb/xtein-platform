import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00106Component } from './GES00106.component';

describe('GES00106Component', () => {
  let component: GES00106Component;
  let fixture: ComponentFixture<GES00106Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00106Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00106Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
