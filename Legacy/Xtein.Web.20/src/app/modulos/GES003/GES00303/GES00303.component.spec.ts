import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00303Component } from './GES00303.component';

describe('GES00303Component', () => {
  let component: GES00303Component;
  let fixture: ComponentFixture<GES00303Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00303Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES00303Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
