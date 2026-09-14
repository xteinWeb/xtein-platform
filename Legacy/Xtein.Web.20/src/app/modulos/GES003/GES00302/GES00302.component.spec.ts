import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00302Component } from './GES00302.component';

describe('GES00302Component', () => {
  let component: GES00302Component;
  let fixture: ComponentFixture<GES00302Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00302Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES00302Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
