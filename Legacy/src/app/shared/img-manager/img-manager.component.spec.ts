import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgManagerComponent } from './img-manager.component';

describe('ImgManagerComponent', () => {
  let component: ImgManagerComponent;
  let fixture: ComponentFixture<ImgManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImgManagerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImgManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
