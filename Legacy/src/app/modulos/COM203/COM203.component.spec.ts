import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM203Component } from './COM203.component';

describe('COM203Component', () => {
  let component: COM203Component;
  let fixture: ComponentFixture<COM203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
