import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN212Component } from './VEN212.component';

describe('VEN212Component', () => {
  let component: VEN212Component;
  let fixture: ComponentFixture<VEN212Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN212Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VEN212Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
