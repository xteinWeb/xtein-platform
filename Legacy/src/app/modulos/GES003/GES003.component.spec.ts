import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES003Component } from './GES003.component';

describe('GES003Component', () => {
  let component: GES003Component;
  let fixture: ComponentFixture<GES003Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES003Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES003Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
