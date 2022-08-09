import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoussoleComponent } from './boussole.component';

describe('BoussoleComponent', () => {
  let component: BoussoleComponent;
  let fixture: ComponentFixture<BoussoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoussoleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoussoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
