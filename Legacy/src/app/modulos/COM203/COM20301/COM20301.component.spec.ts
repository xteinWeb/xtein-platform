import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20301Component } from './COM20301.component';

describe('COM20301Component', () => {
  let component: COM20301Component;
  let fixture: ComponentFixture<COM20301Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20301Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20301Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
