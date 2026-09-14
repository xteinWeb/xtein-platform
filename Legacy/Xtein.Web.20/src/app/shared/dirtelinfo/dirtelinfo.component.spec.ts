import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirtelinfoComponent } from './dirtelinfo.component';

describe('DirtelinfoComponent', () => {
  let component: DirtelinfoComponent;
  let fixture: ComponentFixture<DirtelinfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DirtelinfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirtelinfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
