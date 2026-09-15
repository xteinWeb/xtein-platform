import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXC220Component } from './cxc220.component';

describe('CXC220Component', () => {
  let component: CXC220Component;
  let fixture: ComponentFixture<CXC220Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXC220Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXC220Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
