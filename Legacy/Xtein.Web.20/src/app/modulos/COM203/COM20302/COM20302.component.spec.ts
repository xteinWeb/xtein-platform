import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20302Component } from './COM20302.component';

describe('COM20302Component', () => {
  let component: COM20302Component;
  let fixture: ComponentFixture<COM20302Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20302Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20302Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
