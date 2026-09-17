import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfofiltroComponent } from './infofiltro.component';

describe('InfofiltroComponent', () => {
  let component: InfofiltroComponent;
  let fixture: ComponentFixture<InfofiltroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfofiltroComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfofiltroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
