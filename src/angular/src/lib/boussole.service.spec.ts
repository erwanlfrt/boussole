import { TestBed } from '@angular/core/testing';

import { BoussoleService } from './boussole.service';

describe('BoussoleService', () => {
  let service: BoussoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BoussoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
