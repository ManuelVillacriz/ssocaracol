import { Component, model } from '@angular/core';
import { CommonListarComponent } from '../common-listar.component';
import { ClienteService } from '../../services/cliente/cliente.service';
import { Cliente } from '../../models/cliente/cliente';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.css'
})
export class ClienteComponent extends CommonListarComponent<Cliente,ClienteService>{

  filtro: string = '';
  
  constructor(service:ClienteService){
    super(service);
    this.titulo = 'Listado de Clientes';
    this.nombreModel = model.name;
  }

  buscar(): void {
  this.service.buscarPorFiltro(this.filtro).subscribe(data => {
    this.lista = data;
  });
}

}
