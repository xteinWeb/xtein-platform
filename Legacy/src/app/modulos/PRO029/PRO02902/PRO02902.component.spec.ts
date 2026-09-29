import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02902Component } from './PRO02902.component';

describe('PRO02902Component', () => {
  let component: PRO02902Component;
  let fixture: ComponentFixture<PRO02902Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02902Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02902Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
