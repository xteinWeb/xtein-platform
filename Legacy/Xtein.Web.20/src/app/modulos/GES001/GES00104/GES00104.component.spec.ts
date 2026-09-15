import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00104Component } from './GES00104.component';

describe('GES00104Component', () => {
  let component: GES00104Component;
  let fixture: ComponentFixture<GES00104Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00104Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00104Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
