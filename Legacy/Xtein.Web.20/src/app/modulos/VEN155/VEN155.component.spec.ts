import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VEN155Component } from './VEN155.component';

describe('VEN155Component', () => {
  let component: VEN155Component;
  let fixture: ComponentFixture<VEN155Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VEN155Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VEN155Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
