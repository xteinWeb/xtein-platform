import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN221Component } from './FIN221.component';

describe('FIN221Component', () => {
  let component: FIN221Component;
  let fixture: ComponentFixture<FIN221Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN221Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN221Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
