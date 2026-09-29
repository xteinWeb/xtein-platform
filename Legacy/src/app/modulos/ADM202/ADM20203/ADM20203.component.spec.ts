import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM20203Component } from './ADM20203.component';

describe('ADM20203Component', () => {
  let component: ADM20203Component;
  let fixture: ComponentFixture<ADM20203Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM20203Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM20203Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
