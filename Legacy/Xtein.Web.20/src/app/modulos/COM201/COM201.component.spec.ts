import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM201Component } from './COM201.component';

describe('COM201Component', () => {
  let component: COM201Component;
  let fixture: ComponentFixture<COM201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
