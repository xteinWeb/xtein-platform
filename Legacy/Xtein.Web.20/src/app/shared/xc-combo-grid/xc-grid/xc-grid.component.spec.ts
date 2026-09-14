import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XcGridComponent } from './xc-grid.component';

describe('XcGridComponent', () => {
  let component: XcGridComponent;
  let fixture: ComponentFixture<XcGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XcGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XcGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
