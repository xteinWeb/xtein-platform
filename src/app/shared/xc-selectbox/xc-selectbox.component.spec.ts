import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XcSelectboxComponent } from './xc-selectbox.component';

describe('XcSelectboxComponent', () => {
  let component: XcSelectboxComponent;
  let fixture: ComponentFixture<XcSelectboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XcSelectboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XcSelectboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
