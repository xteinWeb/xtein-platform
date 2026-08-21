import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES_INFOComponent } from './GES_INFO.component';

describe('GES_INFOComponent', () => {
  let component: GES_INFOComponent;
  let fixture: ComponentFixture<GES_INFOComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES_INFOComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GES_INFOComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
