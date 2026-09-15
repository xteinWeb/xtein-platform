import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXC22003Component } from './CXC22003.component';

describe('CXC22003Component', () => {
  let component: CXC22003Component;
  let fixture: ComponentFixture<CXC22003Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXC22003Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXC22003Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
