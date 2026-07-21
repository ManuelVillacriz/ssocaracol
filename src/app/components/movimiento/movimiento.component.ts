import { Component } from '@angular/core';
import { Movimiento } from '../../models/movimiento/movimiento';
import { MovimientoService } from '../../services/movimiento/movimiento.service';
import { CommonListarComponent } from '../common-listar.component';

@Component({
  selector: 'app-movimiento',
  templateUrl: './movimiento.component.html',
  styleUrl: './movimiento.component.css'
})
export class MovimientoComponent extends CommonListarComponent<Movimiento,MovimientoService>{

  filtro: string = '';
  
    constructor(service:MovimientoService){
      super(service);
      this.titulo = 'Listado de Movimientos';
      this.nombreModel = 'Movimiento';
    }

     buscar(): void {
      this.service.buscarPorFiltro(this.filtro).subscribe(data => {
        this.lista = data;
      });
    }

  }