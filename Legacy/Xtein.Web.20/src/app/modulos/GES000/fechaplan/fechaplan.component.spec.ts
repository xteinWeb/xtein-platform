import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FechaplanComponent } from './fechaplan.component';

describe('FechaplanComponent', () => {
  let component: FechaplanComponent;
  let fixture: ComponentFixture<FechaplanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FechaplanComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FechaplanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
