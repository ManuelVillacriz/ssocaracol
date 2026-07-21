import { Injectable } from '@angular/core';
import { BASE_END_POINT_MOVIMIENTO } from '../../config/app';
import { TipoMovimiento } from '../../models/movimiento/tipo-movimiento';
import { CommonService } from '../common.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TipoMovimientoService extends CommonService<TipoMovimiento>{

  protected override  baseEndPoint = BASE_END_POINT_MOVIMIENTO + '/api/tiposMovimiento';

  constructor(http: HttpClient){
      super(http);
    }
}