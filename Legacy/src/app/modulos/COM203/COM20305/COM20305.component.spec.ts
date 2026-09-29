import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20305Component } from './COM20305.component';

describe('COM20305Component', () => {
  let component: COM20305Component;
  let fixture: ComponentFixture<COM20305Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20305Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20305Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
