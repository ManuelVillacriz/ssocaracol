import { Component, NgModule, OnInit } from '@angular/core';
import { CommonFormComponent } from '../common-form.component';
import { Cuenta } from '../../models/cuenta/cuenta';
import { CuentaService } from '../../services/cuenta/cuenta.service';
import { TipoCuenta } from '../../models/cuenta/tipo-cuenta';
import { TipoCuentaService } from '../../services/cuenta/tipo-cuenta.service';

import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../../models/cliente/cliente';
import { ClienteService } from '../../services/cliente.service';
import { FormControl } from '@angular/forms';
import { debounceTime, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-cuenta-form',
  templateUrl: './cuenta-form.component.html',
  styleUrl: './cuenta-form.component.css'
})

  export class CuentaFormComponent extends CommonFormComponent<Cuenta, CuentaService> implements OnInit {

    tiposCuenta: TipoCuenta[] = [];
    clientes: Cliente[] = [];
    
    // 🔥 tipado fuerte
    clienteControl = new FormControl<Cliente | string | null>(null);

    constructor(
      service: CuentaService,
      private tipoCuentaService: TipoCuentaService,
      private clienteService: ClienteService,
      router: Router,
      route: ActivatedRoute
    ) {
      super(service, router, route);
      this.titulo = "Crear Cuenta";
      this.model = new Cuenta();
      this.redirect = '/cuenta';
      this.nombreModel = Cuenta.name;
    }

    override ngOnInit(): void {

      this.tipoCuentaService.listar().subscribe(tiposCuenta => {
        this.tiposCuenta = tiposCuenta;
        this.setSelectedValues();
      });

      this.initAutocomplete();

      super.ngOnInit();
    }

    override onModelLoaded(model: Cuenta): void {

      if (model?.cliente) {

        const clienteNormalizado = this.mapCliente(model.cliente);

        this.clienteControl.setValue(clienteNormalizado, { emitEvent: false });
        this.clientes = [clienteNormalizado];        
      }
    }

    // 🔹 separar lógica
    private initAutocomplete(): void {
      this.clienteControl.valueChanges
        .pipe(
          debounceTime(300),
          switchMap(value => {

            if (typeof value !== 'string') {
              return of([]);
            }

            if (!value || value.length < 2) {
              return of([]);
            }

            return this.clienteService.buscar(value)
              .pipe(map(resp => resp.content.map(this.mapCliente)));
          })
        )
        .subscribe(clientes => this.clientes = clientes);
    }

    // 🔥 centralizar transformación
    private mapCliente = (c: any): Cliente => ({
      id: c.id ?? c.clienteId,
      nombre: c.nombre,
      apellido: c.apellido,
      descripcion: ''
    });

    // 🔹 display limpio
  displayCliente = (cliente: Cliente | string | null): string => {
    if (!cliente) return '';
    if (typeof cliente === 'string') return cliente;
    return `${cliente.nombre} ${cliente.apellido}`;
  };

    // 🔹 selección (SIN duplicación)
    seleccionarCliente(cliente: Cliente): void {
    this.clienteControl.setValue(cliente);
    this.model.cliente = cliente; // 🔥 esto faltaba
  } 

    private setSelectedValues(): void {
      if (!this.model) return;

      if (this.model.tipoCuenta && this.tiposCuenta.length) {
        this.model.tipoCuenta =
          this.tiposCuenta.find(t => t.id === this.model.tipoCuenta.id)
          || this.model.tipoCuenta;
      }
    }

    override crear(): void {
    if (!this.syncCliente()) return;
    super.crear();
  }

  override editar(): void {
    if (!this.syncCliente()) return;
    super.editar();
  }

  compareById(a: any, b: any): boolean { return a?.id === b?.id; }

  private syncCliente(): boolean {

    const cliente = this.clienteControl.value;

    if (!cliente || typeof cliente === 'string') {
      this.error = { cliente: 'Debe seleccionar un cliente válido' };
      return false;
    }

    this.model.cliente = cliente;
    return true;
  }
}