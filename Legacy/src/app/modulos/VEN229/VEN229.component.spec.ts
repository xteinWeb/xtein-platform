import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN229Component } from './ven229.component';

describe('VEN229Component', () => {
  let component: VEN229Component;
  let fixture: ComponentFixture<VEN229Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN229Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VEN229Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
