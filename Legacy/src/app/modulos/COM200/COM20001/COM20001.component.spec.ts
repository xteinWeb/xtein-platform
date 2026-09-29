import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20001Component } from './COM20001.component';

describe('COM20001Component', () => {
  let component: COM20001Component;
  let fixture: ComponentFixture<COM20001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
