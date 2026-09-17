import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02701Component } from './PRO02701.component';

describe('PRO02701Component', () => {
  let component: PRO02701Component;
  let fixture: ComponentFixture<PRO02701Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02701Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02701Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
