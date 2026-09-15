import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO03202Component } from './pro03202.component';

describe('PRO03202Component', () => {
  let component: PRO03202Component;
  let fixture: ComponentFixture<PRO03202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO03202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO03202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
