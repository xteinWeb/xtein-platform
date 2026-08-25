import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sdk } from './sdk';

describe('Sdk', () => {
  let component: Sdk;
  let fixture: ComponentFixture<Sdk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sdk]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sdk);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
