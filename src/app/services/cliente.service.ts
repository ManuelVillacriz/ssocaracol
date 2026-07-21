import { Injectable } from '@angular/core';
import { CommonService } from './common.service';
import { Cliente } from '../models/cliente/cliente';
import { BASE_END_POINT_CUENTA } from '../config/app';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClienteService extends CommonService<Cliente> {

  protected override  baseEndPoint = BASE_END_POINT_CUENTA + '/api/clientes';

  constructor(    
    http: HttpClient,    
  ) {
    super(http);
  }

   buscar(query: string) {
    const params = new HttpParams()
      .set('query', query || '')
      .set('page', 0)
      .set('size', 10);

    return this.http.get<any>(`${this.baseEndPoint}/buscar`, { params });
  }

  
}