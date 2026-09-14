import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN208Component } from './VEN208.component';

describe('VEN208Component', () => {
  let component: VEN208Component;
  let fixture: ComponentFixture<VEN208Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN208Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VEN208Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
