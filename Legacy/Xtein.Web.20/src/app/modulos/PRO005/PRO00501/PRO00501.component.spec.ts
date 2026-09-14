import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO00501Component } from './PRO00501.component';

describe('PRO00501Component', () => {
  let component: PRO00501Component;
  let fixture: ComponentFixture<PRO00501Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO00501Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO00501Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
