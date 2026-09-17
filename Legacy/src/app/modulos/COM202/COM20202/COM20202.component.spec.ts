import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20202Component } from './com20202.component';

describe('COM20202Component', () => {
  let component: COM20202Component;
  let fixture: ComponentFixture<COM20202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
