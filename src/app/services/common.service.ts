import { Injectable } from '@angular/core';
import { Generic } from '../models/generic';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService <E extends Generic> {
  protected baseEndPoint: string;

  protected cabeceras: HttpHeaders = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(protected http: HttpClient) { }

  public listar(): Observable<E[]> {
    return this.http.get<E[]>(this.baseEndPoint);
  }

  public listarPaginas(page: string, size: string): Observable<any>{
    const params = new HttpParams()
    .set('page',page)
    .set('size',size);
    return this.http.get<any>(`${this.baseEndPoint}`, { params: params });
  }

  public ver(id: number): Observable<E>{
    return this.http.get<E>(`${this.baseEndPoint}/${id}`);
  }

  public crear(e: E): Observable<E> {
    return this.http.post<E>(this.baseEndPoint, e, { headers: this.cabeceras });
  }

  public editar(e: E): Observable<E> {
    return this.http.put<E>(`${this.baseEndPoint}/${e.id}`,e, { headers: this.cabeceras });
  }

  public eliminar(id: number): Observable<void>{
    return this.http.delete<void>(`${this.baseEndPoint}/${id}`);
  }
}
