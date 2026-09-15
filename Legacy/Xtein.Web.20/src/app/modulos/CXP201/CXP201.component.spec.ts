import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXP201Component } from './cxp201.component';

describe('CXP201Component', () => {
  let component: CXP201Component;
  let fixture: ComponentFixture<CXP201Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXP201Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXP201Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
