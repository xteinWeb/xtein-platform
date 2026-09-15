import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CXC22001Component } from './cxc22001.component';

describe('CXC22001Component', () => {
  let component: CXC22001Component;
  let fixture: ComponentFixture<CXC22001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CXC22001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CXC22001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
