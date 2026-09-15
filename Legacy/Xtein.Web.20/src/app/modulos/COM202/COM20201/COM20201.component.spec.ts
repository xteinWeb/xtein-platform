import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20201Component } from './COM20201.component';

describe('COM20201Component', () => {
  let component: COM20201Component;
  let fixture: ComponentFixture<COM20201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
