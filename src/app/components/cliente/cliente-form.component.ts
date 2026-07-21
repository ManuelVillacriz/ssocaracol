import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente/cliente.service';
import { CommonFormComponent } from '../common-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Genero } from '../../models/cliente/genero';
import { TipoIdentificacion } from '../../models/cliente/tipo-identificacion';
import { GeneroService } from '../../services/cliente/genero.service';
import { TipoIdentificacionService } from '../../services/cliente/tipo-identificacion.service';
import { ClienteMapper } from './cliente-mapper';
import { Cliente } from '../../models/cliente/cliente';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css'
})
export class ClienteFormComponent  extends CommonFormComponent<Cliente, ClienteService> implements OnInit {

  generos: Genero[] = [];
  tiposIdentificacion: TipoIdentificacion[] = [];
  fechaMaxima: Date = new Date();
  

  constructor(service: ClienteService,
    private generoService: GeneroService,
    private tipoidentificacionService: TipoIdentificacionService,
    router: Router,
    route: ActivatedRoute) {
    super(service, router, route);
    this.titulo = "Crear Cliente";
    this.model = new Cliente();
    this.redirect = '/cliente';
    this.nombreModel = Cliente.name;
  }

  override ngOnInit(): void {
    
    this.generoService.listar().subscribe(generos => {
      this.generos = generos;
      this.setSelectedValues();
    });

    this.tipoidentificacionService.listar().subscribe(tipos => {
      this.tiposIdentificacion = tipos;
      this.setSelectedValues();
    });

    super.ngOnInit();
  }
  
  private setSelectedValues(): void {

    if (!this.model) return;

    if (this.model.genero && this.generos.length) {
      this.model.genero = this.generos.find(g => g.id === this.model.genero.id) || this.model.genero;
    }

    if (this.model.tipoIdentificacion && this.tiposIdentificacion.length) {
      this.model.tipoIdentificacion = this.tiposIdentificacion.find(t => t.id === this.model.tipoIdentificacion.id) || this.model.tipoIdentificacion;
    }
  }

  compareById(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}