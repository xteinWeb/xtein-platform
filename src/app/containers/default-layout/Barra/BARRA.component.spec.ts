import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BARRAComponent } from './BARRA.component';

describe('BARRAComponent', () => {
  let component: BARRAComponent;
  let fixture: ComponentFixture<BARRAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BARRAComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BARRAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
