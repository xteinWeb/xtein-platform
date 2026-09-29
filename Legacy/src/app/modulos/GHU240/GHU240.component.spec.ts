import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GHU240Component } from './GHU240.component';

describe('GHU240Component', () => {
  let component: GHU240Component;
  let fixture: ComponentFixture<GHU240Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GHU240Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GHU240Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
