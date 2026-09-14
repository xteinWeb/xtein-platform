import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM01Component } from './COM01.component';

describe('COM01Component', () => {
  let component: COM01Component;
  let fixture: ComponentFixture<COM01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM01Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(COM01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
