import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN202Component } from './FIN202.component';

describe('FIN202Component', () => {
  let component: FIN202Component;
  let fixture: ComponentFixture<FIN202Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN202Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN202Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
