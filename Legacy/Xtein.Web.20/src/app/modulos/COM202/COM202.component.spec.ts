import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM202Component } from './com202.component';

describe('COM202Component', () => {
  let component: COM202Component;
  let fixture: ComponentFixture<COM202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
