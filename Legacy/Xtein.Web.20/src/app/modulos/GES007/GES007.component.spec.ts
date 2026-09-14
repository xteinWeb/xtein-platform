import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES007Component } from './GES007.component';

describe('GES007Component', () => {
  let component: GES007Component;
  let fixture: ComponentFixture<GES007Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES007Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES007Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
