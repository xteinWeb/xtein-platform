import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES000Component } from './GES000.component';

describe('GES000Component', () => {
  let component: GES000Component;
  let fixture: ComponentFixture<GES000Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES000Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES000Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
