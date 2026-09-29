import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CAL002Component } from './CAL002.component';

describe('CAL002Component', () => {
  let component: CAL002Component;
  let fixture: ComponentFixture<CAL002Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CAL002Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CAL002Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
