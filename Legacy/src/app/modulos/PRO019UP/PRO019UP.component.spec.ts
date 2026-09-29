import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PRO019UPComponent } from './PRO019UP.component';

describe('PRO019UPComponent', () => {
  let component: PRO019UPComponent;
  let fixture: ComponentFixture<PRO019UPComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PRO019UPComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PRO019UPComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
