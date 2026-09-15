import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO03203Component } from './pro03203.component';

describe('PRO03203Component', () => {
  let component: PRO03203Component;
  let fixture: ComponentFixture<PRO03203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO03203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO03203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
