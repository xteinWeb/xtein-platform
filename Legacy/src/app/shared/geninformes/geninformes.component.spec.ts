import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeninformesComponent } from './geninformes.component';

describe('GeninformesComponent', () => {
  let component: GeninformesComponent;
  let fixture: ComponentFixture<GeninformesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeninformesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeninformesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
