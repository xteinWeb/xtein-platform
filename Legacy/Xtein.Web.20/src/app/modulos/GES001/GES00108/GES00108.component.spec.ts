import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00108Component } from './GES00108.component';

describe('GES00108Component', () => {
  let component: GES00108Component;
  let fixture: ComponentFixture<GES00108Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00108Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00108Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
