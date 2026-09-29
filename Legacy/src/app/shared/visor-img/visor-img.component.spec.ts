import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisorImgComponent } from './visor-img.component';

describe('VisorImgComponent', () => {
  let component: VisorImgComponent;
  let fixture: ComponentFixture<VisorImgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisorImgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisorImgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
