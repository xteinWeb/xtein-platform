import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COM20203Component } from './com20203.component';

describe('COM20203Component', () => {
  let component: COM20203Component;
  let fixture: ComponentFixture<COM20203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COM20203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COM20203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
