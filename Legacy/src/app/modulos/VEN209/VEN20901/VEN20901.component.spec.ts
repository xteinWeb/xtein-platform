import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN20901Component } from './VEN20901.component';

describe('VEN20901Component', () => {
  let component: VEN20901Component;
  let fixture: ComponentFixture<VEN20901Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN20901Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VEN20901Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
