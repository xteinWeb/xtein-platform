import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM207Component } from './com207.component';

describe('COM207Component', () => {
  let component: COM207Component;
  let fixture: ComponentFixture<COM207Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM207Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM207Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
