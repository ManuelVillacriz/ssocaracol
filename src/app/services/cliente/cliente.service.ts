import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClienteMapper } from '../../components/cliente/cliente-mapper';
import { Cliente } from '../../models/cliente/cliente';
import { map, Observable } from 'rxjs';
import { CommonService } from '../common.service';
import { BASE_END_POINT_CLIENTE } from '../../config/app';

@Injectable({
  providedIn: 'root'
})
export class ClienteService extends CommonService<Cliente> {

  protected override  baseEndPoint = BASE_END_POINT_CLIENTE + '/api/clientes';

  constructor(    
    private mapper: ClienteMapper,
    http: HttpClient,    
  ) {
    super(http);
  }

  override crear(model: Cliente): Observable<Cliente> {

  const request = this.mapper.toRequest(model);  

  return this.http.post<any>(this.baseEndPoint, request)
    .pipe(map(res => this.mapper.toModel(res)));
}

override editar(model: Cliente): Observable<Cliente> {
  const request = this.mapper.toRequest(model);

  return this.http.put<any>(
    `${this.baseEndPoint}/${model.id}`,
    request
  ).pipe(
    map(res => this.mapper.toModel(res))
  );
}

 buscarPorFiltro(filtro: string): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(`${this.baseEndPoint}/buscarPorFiltro`, {
    params: { filtro }
  });
}

}