import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00703Component } from './GES00703.component';

describe('GES00703Component', () => {
  let component: GES00703Component;
  let fixture: ComponentFixture<GES00703Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00703Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES00703Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
