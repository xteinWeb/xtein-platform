import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN002Component } from './VEN002.component';

describe('VEN002Component', () => {
  let component: VEN002Component;
  let fixture: ComponentFixture<VEN002Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN002Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VEN002Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
