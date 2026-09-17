import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThumbnailimgComponent } from './thumbnailimg.component';

describe('ThumbnailimgComponent', () => {
  let component: ThumbnailimgComponent;
  let fixture: ComponentFixture<ThumbnailimgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThumbnailimgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThumbnailimgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
