import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00301Component } from './GES00301.component';

describe('GES00301Component', () => {
  let component: GES00301Component;
  let fixture: ComponentFixture<GES00301Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00301Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES00301Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
