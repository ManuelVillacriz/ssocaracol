import { Injectable } from '@angular/core';
import { Movimiento } from '../../models/movimiento/movimiento';
import { BASE_END_POINT_MOVIMIENTO } from '../../config/app';
import { CommonService } from '../common.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { MovimientoMapper } from '../../components/movimiento/movimiento-mapper';
import { Reporte } from '../../models/movimiento/reporte';

@Injectable({
  providedIn: 'root'
})
export class MovimientoService extends CommonService<Movimiento> {

  protected override  baseEndPoint = BASE_END_POINT_MOVIMIENTO + '/api/movimientos';
  
    constructor(    
      private mapper: MovimientoMapper,
      http: HttpClient,    
    ) {
      super(http);
    }

override crear(model: Movimiento): Observable<Movimiento> {
  const request = this.mapper.toRequest(model);

  return this.http.post<any>(this.baseEndPoint, request)
    .pipe(map(res => this.mapper.toModel(res)));
}

override editar(model: Movimiento): Observable<Movimiento> {
  const request = this.mapper.toRequest(model);

  return this.http.put<any>(`${this.baseEndPoint}/${model.id}`, request)
    .pipe(map(res => this.mapper.toModel(res)));
}

public reportMovimientosByClienteAndFecha(
  fechaInicio: Date, 
  fechaFin: Date,
  clienteId: number
): Observable<Reporte[]> {

  const params = new HttpParams()
    .set('fechaInicio', this.formatDate(fechaInicio))
    .set('fechaFin', this.formatDate(fechaFin))
    .set('cliente', clienteId.toString());

  return this.http.get<Reporte[]>(`${this.baseEndPoint}/reporte`, { params });
}

public descargarReportePdf(
  fechaInicio: Date,
  fechaFin: Date,
  clienteId: number
): Observable<Blob> {

  const params = new HttpParams()
    .set('fechaInicio', fechaInicio.toISOString().split('T')[0])
    .set('fechaFin', fechaFin.toISOString().split('T')[0])
    .set('cliente', clienteId);

  return this.http.get(`${this.baseEndPoint}/reporte/pdf`, {
    params,
    responseType: 'blob'
  });
}

private formatDate(date: Date): string {
  if (!date) return '';

  return new Date(date).toISOString().split('T')[0];
}

 buscarPorFiltro(filtro: string): Observable<Movimiento[]> {
  return this.http.get<Movimiento[]>(`${this.baseEndPoint}/buscarPorFiltro`, {
    params: { filtro }
  });
}


}
