import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HISTORIALNTFComponent } from './historial-ntf.component';

describe('HISTORIALNTFComponent', () => {
  let component: HISTORIALNTFComponent;
  let fixture: ComponentFixture<HISTORIALNTFComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HISTORIALNTFComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HISTORIALNTFComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
