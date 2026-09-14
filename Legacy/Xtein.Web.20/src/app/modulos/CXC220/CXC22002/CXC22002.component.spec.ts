import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXC22002Component } from './CXC22002.component';

describe('CXC22002Component', () => {
  let component: CXC22002Component;
  let fixture: ComponentFixture<CXC22002Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXC22002Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXC22002Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
