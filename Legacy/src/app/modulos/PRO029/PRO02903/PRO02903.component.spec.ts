import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO02903Component } from './PRO02903.component';

describe('PRO02903Component', () => {
  let component: PRO02903Component;
  let fixture: ComponentFixture<PRO02903Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO02903Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO02903Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
