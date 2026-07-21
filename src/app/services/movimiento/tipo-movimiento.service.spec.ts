import { TestBed } from '@angular/core/testing';

import { TipoMovimientoService } from './tipo-movimiento.service';

describe('TipoMovimientoService', () => {
  let service: TipoMovimientoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoMovimientoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
