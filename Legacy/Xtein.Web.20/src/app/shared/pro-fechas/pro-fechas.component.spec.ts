import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProFechasComponent } from './pro-fechas.component';

describe('ProFechasComponent', () => {
  let component: ProFechasComponent;
  let fixture: ComponentFixture<ProFechasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProFechasComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProFechasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
