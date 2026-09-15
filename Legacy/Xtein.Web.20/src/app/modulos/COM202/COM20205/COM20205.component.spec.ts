import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20205Component } from './COM20205.component';

describe('COM20205Component', () => {
  let component: COM20205Component;
  let fixture: ComponentFixture<COM20205Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20205Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20205Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
