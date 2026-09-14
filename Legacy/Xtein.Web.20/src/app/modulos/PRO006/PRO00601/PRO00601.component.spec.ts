import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO00601Component } from './PRO00601.component';

describe('PRO00601Component', () => {
  let component: PRO00601Component;
  let fixture: ComponentFixture<PRO00601Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO00601Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO00601Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
