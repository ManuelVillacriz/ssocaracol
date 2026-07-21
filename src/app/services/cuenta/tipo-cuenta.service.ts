import { Injectable } from '@angular/core';
import { TipoCuenta } from '../../models/cuenta/tipo-cuenta';
import { CommonService } from '../common.service';
import { HttpClient } from '@angular/common/http';
import { BASE_END_POINT_CUENTA } from '../../config/app';

@Injectable({
  providedIn: 'root'
})
export class TipoCuentaService extends CommonService<TipoCuenta>{

  protected override  baseEndPoint = BASE_END_POINT_CUENTA + '/api/tiposCuenta';

  constructor(http: HttpClient){
      super(http);
    }
}
