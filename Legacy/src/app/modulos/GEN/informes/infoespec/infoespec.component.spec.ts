import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoespecComponent } from './infoespec.component';

describe('InfoespecComponent', () => {
  let component: InfoespecComponent;
  let fixture: ComponentFixture<InfoespecComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfoespecComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfoespecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
