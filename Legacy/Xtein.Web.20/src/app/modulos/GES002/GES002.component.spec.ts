import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GES002Component } from './GES002.component';

describe('GES002Component', () => {
  let component: GES002Component;
  let fixture: ComponentFixture<GES002Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GES002Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GES002Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
