import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20204Component } from './com20204.component';

describe('COM20204Component', () => {
  let component: COM20204Component;
  let fixture: ComponentFixture<COM20204Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20204Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20204Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
