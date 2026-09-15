import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00101Component } from './GES00101.component';

describe('GES00101Component', () => {
  let component: GES00101Component;
  let fixture: ComponentFixture<GES00101Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00101Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00101Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
