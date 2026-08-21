import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocelecComponent } from './docelec.component';

describe('DocelecComponent', () => {
  let component: DocelecComponent;
  let fixture: ComponentFixture<DocelecComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocelecComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocelecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
