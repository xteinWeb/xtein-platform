import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CAL001Component } from './CAL001.component';

describe('CAL001Component', () => {
  let component: CAL001Component;
  let fixture: ComponentFixture<CAL001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CAL001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CAL001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
