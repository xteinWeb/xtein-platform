import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN230Component } from './FIN230.component';

describe('FIN230Component', () => {
  let component: FIN230Component;
  let fixture: ComponentFixture<FIN230Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN230Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN230Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
