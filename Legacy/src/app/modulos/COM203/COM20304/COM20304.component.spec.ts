import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20304Component } from './COM20304.component';

describe('COM20304Component', () => {
  let component: COM20304Component;
  let fixture: ComponentFixture<COM20304Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20304Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20304Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
