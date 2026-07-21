import { Component, OnInit } from '@angular/core';
import { Movimiento } from '../../models/movimiento/movimiento';
import { MovimientoService } from '../../services/movimiento/movimiento.service';
import { TipoMovimiento } from '../../models/movimiento/tipo-movimiento';
import { Cuenta } from '../../models/cuenta/cuenta';
import { TipoMovimientoService } from '../../services/movimiento/tipo-movimiento.service';
import { CuentaService } from '../../services/cuenta/cuenta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonFormComponent } from '../common-form.component';

@Component({
  selector: 'app-movimiento-form',
  templateUrl: './movimiento-form.component.html',
  styleUrl: './movimiento-form.component.css'
})
export class MovimientoFormComponent extends CommonFormComponent<Movimiento, MovimientoService> implements OnInit {

  tiposMovimiento: TipoMovimiento[] = [];
  cuentas: Cuenta[] = [];

  constructor(service: MovimientoService,
      private tipoMovimientoService: TipoMovimientoService,
      private cuentaService: CuentaService,
      router: Router,
      route: ActivatedRoute) {
      super(service, router, route);
      this.titulo = "Crear Cuenta";
      this.model = new Movimiento();
      this.redirect = '/movimiento';
      this.nombreModel = Cuenta.name;
    }

    override ngOnInit(): void {
    
    this.tipoMovimientoService.listar().subscribe(tiposMovimiento => {
      this.tiposMovimiento = tiposMovimiento;
      this.setSelectedValues();
    });

    this.cuentaService.listar().subscribe(cuentas => {
      this.cuentas = cuentas;
      this.setSelectedValues();
    });

    super.ngOnInit();
  }
  
  private setSelectedValues(): void {

    if (!this.model) return;

    if (this.model.tipoMovimiento && this.tiposMovimiento.length) {
      this.model.tipoMovimiento = this.tiposMovimiento.find(g => g.id === this.model.tipoMovimiento.id) || this.model.tipoMovimiento;
    }

    if (this.model.cuenta && this.cuentas.length) {
      this.model.cuenta = this.cuentas.find(t => t.id === this.model.cuenta.id) || this.model.cuenta;
    }
  }

  compareById(a: any, b: any): boolean {
    return a?.id === b?.id;
  }

}
