import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM203Component } from './ADM203.component';

describe('ADM203Component', () => {
  let component: ADM203Component;
  let fixture: ComponentFixture<ADM203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
