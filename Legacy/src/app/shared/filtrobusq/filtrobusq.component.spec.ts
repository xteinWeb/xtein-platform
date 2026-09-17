import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltrobusqComponent } from './filtrobusq.component';

describe('FiltrobusqComponent', () => {
  let component: FiltrobusqComponent;
  let fixture: ComponentFixture<FiltrobusqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FiltrobusqComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltrobusqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
