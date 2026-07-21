import { Component, model } from '@angular/core';
import { Cuenta } from '../../models/cuenta/cuenta';
import { CuentaService } from '../../services/cuenta/cuenta.service';
import { CommonListarComponent } from '../common-listar.component';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent extends CommonListarComponent<Cuenta,CuentaService>{

  filtro: string = '';
  
    constructor(service:CuentaService){
      super(service);
      this.titulo = 'Listado de Cuentas';
      this.nombreModel = model.name;
    }

     buscar(): void {
      this.service.buscarPorFiltro(this.filtro).subscribe(data => {
        this.lista = data;
      });
}
}
