import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XalertComponent } from './xalert.component';

describe('XalertComponent', () => {
  let component: XalertComponent;
  let fixture: ComponentFixture<XalertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ XalertComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XalertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
