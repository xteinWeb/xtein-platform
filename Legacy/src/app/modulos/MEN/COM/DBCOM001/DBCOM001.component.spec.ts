import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DBCOM001Component } from './dbcom001.component';

describe('DBCOM001Component', () => {
  let component: DBCOM001Component;
  let fixture: ComponentFixture<DBCOM001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DBCOM001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DBCOM001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
