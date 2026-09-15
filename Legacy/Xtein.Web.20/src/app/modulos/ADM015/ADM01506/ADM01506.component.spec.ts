import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM01506Component } from './ADM01506.component';

describe('ADM01506Component', () => {
  let component: ADM01506Component;
  let fixture: ComponentFixture<ADM01506Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ADM01506Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM01506Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
