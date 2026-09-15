import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN230Component } from './VEN230.component';

describe('VEN230Component', () => {
  let component: VEN230Component;
  let fixture: ComponentFixture<VEN230Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN230Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VEN230Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
