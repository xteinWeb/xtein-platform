import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisorrepComponent } from './visorrep.component';

describe('VisorrepComponent', () => {
  let component: VisorrepComponent;
  let fixture: ComponentFixture<VisorrepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VisorrepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VisorrepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
