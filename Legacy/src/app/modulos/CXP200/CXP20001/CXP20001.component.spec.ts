import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXP20001Component } from './cxp20001.component';

describe('CXP20001Component', () => {
  let component: CXP20001Component;
  let fixture: ComponentFixture<CXP20001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXP20001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXP20001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
