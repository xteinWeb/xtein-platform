import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00107Component } from './GES00107.component';

describe('GES00107Component', () => {
  let component: GES00107Component;
  let fixture: ComponentFixture<GES00107Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00107Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES00107Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
