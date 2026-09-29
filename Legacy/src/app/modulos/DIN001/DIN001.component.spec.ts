import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DIN001Component } from './DIN001.component';

describe('DIN001Component', () => {
  let component: DIN001Component;
  let fixture: ComponentFixture<DIN001Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DIN001Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DIN001Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
