import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO009UPComponent } from './PRO009UP.component';

describe('PRO009UPComponent', () => {
  let component: PRO009UPComponent;
  let fixture: ComponentFixture<PRO009UPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO009UPComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PRO009UPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
