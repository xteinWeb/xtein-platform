import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00105Component } from './GES00105.component';

describe('GES00105Component', () => {
  let component: GES00105Component;
  let fixture: ComponentFixture<GES00105Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00105Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00105Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
