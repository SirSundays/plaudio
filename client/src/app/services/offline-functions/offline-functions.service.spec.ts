import { TestBed } from '@angular/core/testing';

import { OfflineFunctionsService } from './offline-functions.service';

describe('OfflineFunctionsService', () => {
  let service: OfflineFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
