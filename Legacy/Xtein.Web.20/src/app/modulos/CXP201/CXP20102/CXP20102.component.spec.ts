import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXP20102Component } from './CXP20102.component';

describe('CX020102Component', () => {
  let component: CXP20102Component;
  let fixture: ComponentFixture<CXP20102Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXP20102Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXP20102Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
