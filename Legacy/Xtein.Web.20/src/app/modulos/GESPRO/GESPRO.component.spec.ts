import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GESPROComponent } from './GESPRO.component';

describe('GESPROComponent', () => {
  let component: GESPROComponent;
  let fixture: ComponentFixture<GESPROComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GESPROComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GESPROComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
