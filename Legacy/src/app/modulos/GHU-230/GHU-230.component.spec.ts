import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GHU230Component } from './GHU-230.component';

describe('GHU230Component', () => {
  let component: GHU230Component;
  let fixture: ComponentFixture<GHU230Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GHU230Component]
    })
      .compileComponents();

    fixture = TestBed.createComponent(GHU230Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
