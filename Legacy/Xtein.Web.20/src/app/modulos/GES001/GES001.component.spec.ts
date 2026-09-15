import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES001Component } from './GES001.component';

describe('GES001Component', () => {
  let component: GES001Component;
  let fixture: ComponentFixture<GES001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES001Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
