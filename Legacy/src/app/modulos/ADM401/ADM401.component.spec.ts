import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM401Component } from './ADM401.component';

describe('ADM401Component', () => {
  let component: ADM401Component;
  let fixture: ComponentFixture<ADM401Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM401Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM401Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
