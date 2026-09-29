import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AplsettingsComponent } from './aplsettings.component';

describe('AplsettingsComponent', () => {
  let component: AplsettingsComponent;
  let fixture: ComponentFixture<AplsettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AplsettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AplsettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
