import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FIN231Component } from './FIN231.component';

describe('FIN231Component', () => {
  let component: FIN231Component;
  let fixture: ComponentFixture<FIN231Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FIN231Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FIN231Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
