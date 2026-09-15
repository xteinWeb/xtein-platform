import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES00701Component } from './GES00701.component';

describe('GES00701Component', () => {
  let component: GES00701Component;
  let fixture: ComponentFixture<GES00701Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES00701Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES00701Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
