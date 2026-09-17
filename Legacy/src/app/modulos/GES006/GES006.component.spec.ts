import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES006Component } from './GES006.component';

describe('GES006Component', () => {
  let component: GES006Component;
  let fixture: ComponentFixture<GES006Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES006Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES006Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
