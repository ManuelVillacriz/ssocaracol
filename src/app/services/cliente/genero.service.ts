import { Injectable } from '@angular/core';
import { Genero } from '../../models/cliente/genero';
import { HttpClient } from '@angular/common/http';
import { BASE_END_POINT_CLIENTE } from '../../config/app';
import { CommonService } from '../common.service';


@Injectable({
  providedIn: 'root'
})
export class GeneroService extends CommonService<Genero>{

  protected override  baseEndPoint = BASE_END_POINT_CLIENTE + '/api/generos';

  constructor(http: HttpClient){
    super(http);
  }
}
