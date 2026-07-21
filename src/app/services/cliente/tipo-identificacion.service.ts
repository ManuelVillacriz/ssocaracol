import { Injectable } from '@angular/core';
import { TipoIdentificacion } from '../../models/cliente/tipo-identificacion';
import { CommonService } from '../common.service';
import { BASE_END_POINT_CLIENTE } from '../../config/app';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TipoIdentificacionService extends CommonService<TipoIdentificacion>{

  protected override  baseEndPoint = BASE_END_POINT_CLIENTE + '/api/tiposIdentificacion';

  constructor(http: HttpClient){
    super(http);
  }
}
