import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SboxestadosComponent } from './sboxestados.component';

describe('SboxestadosComponent', () => {
  let component: SboxestadosComponent;
  let fixture: ComponentFixture<SboxestadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SboxestadosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SboxestadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
