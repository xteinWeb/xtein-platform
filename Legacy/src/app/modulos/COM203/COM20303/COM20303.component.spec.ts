import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20303Component } from './COM20303.component';

describe('COM20303Component', () => {
  let component: COM20303Component;
  let fixture: ComponentFixture<COM20303Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20303Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20303Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
