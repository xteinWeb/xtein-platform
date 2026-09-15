import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES004Component } from './GES004.component';

describe('GES003Component', () => {
  let component: GES004Component;
  let fixture: ComponentFixture<GES004Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES004Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES004Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
