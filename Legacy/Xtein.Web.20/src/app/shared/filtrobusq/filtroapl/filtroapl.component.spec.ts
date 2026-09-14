import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroaplComponent } from './filtroapl.component';

describe('FiltroaplComponent', () => {
  let component: FiltroaplComponent;
  let fixture: ComponentFixture<FiltroaplComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FiltroaplComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltroaplComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
