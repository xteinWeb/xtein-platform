import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UBICACIONESComponent } from './ubicaciones.component';

describe('UBICACIONESComponent', () => {
  let component: UBICACIONESComponent;
  let fixture: ComponentFixture<UBICACIONESComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UBICACIONESComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UBICACIONESComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
