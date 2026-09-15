import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXC210Component } from './CXC210.component';

describe('CXC210Component', () => {
  let component: CXC210Component;
  let fixture: ComponentFixture<CXC210Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXC210Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXC210Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
