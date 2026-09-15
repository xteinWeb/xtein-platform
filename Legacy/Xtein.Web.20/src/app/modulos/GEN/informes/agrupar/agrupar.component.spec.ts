import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgruparComponent } from './agrupar.component';

describe('AgruparComponent', () => {
  let component: AgruparComponent;
  let fixture: ComponentFixture<AgruparComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AgruparComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AgruparComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
