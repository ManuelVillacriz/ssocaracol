import { Injectable } from '@angular/core';
import { Cuenta } from '../../models/cuenta/cuenta';
import { CommonService } from '../common.service';
import { CuentaMapper } from '../../components/cuenta/cuenta-mapper';
import { HttpClient } from '@angular/common/http';
import { BASE_END_POINT_CUENTA } from '../../config/app';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CuentaService extends CommonService<Cuenta> {

  protected override  baseEndPoint = BASE_END_POINT_CUENTA + '/api/cuentas';
  
    constructor(    
      private mapper: CuentaMapper,
      http: HttpClient,    
    ) {
      super(http);
    }

override crear(model: Cuenta): Observable<Cuenta> {
  const request = this.mapper.toRequest(model);

  return this.http.post<any>(this.baseEndPoint, request)
    .pipe(map(res => this.mapper.toModel(res)));
}

override editar(model: Cuenta): Observable<Cuenta> {
  const request = this.mapper.toRequest(model);

  return this.http.put<any>(`${this.baseEndPoint}/${model.id}`, request)
    .pipe(map(res => this.mapper.toModel(res)));
}

buscarPorFiltro(filtro: string): Observable<Cuenta[]> {
  return this.http.get<Cuenta[]>(`${this.baseEndPoint}/buscarPorFiltro`, {
    params: { filtro }
  });
}


}
