import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADM25501Component } from './ADM25501.component';

describe('ADM25501Component', () => {
  let component: ADM25501Component;
  let fixture: ComponentFixture<ADM25501Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ADM25501Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ADM25501Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
