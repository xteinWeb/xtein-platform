import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XcComboGridComponent } from './xc-combo-grid.component';

describe('XcComboGridComponent', () => {
  let component: XcComboGridComponent;
  let fixture: ComponentFixture<XcComboGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XcComboGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XcComboGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
