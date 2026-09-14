import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COSTOSDIRECTOSComponent } from './COSTOS-DIRECTOS.component';

describe('COSTOSDIRECTOSComponent', () => {
  let component: COSTOSDIRECTOSComponent;
  let fixture: ComponentFixture<COSTOSDIRECTOSComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ COSTOSDIRECTOSComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(COSTOSDIRECTOSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
