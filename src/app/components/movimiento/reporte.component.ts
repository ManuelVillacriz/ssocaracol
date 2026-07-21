import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Cliente } from '../../models/cliente/cliente';
import { ClienteService } from '../../services/cliente/cliente.service';
import { MovimientoService } from '../../services/movimiento/movimiento.service';
import { Movimiento } from '../../models/movimiento/movimiento';
import Swal from 'sweetalert2';
import { Reporte } from '../../models/movimiento/reporte';

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrl: './reporte.component.css'
})
export class ReporteComponent implements OnInit{

  error: any;
  clientes: Cliente[] = [];
  movimientos: Reporte[] = [];
  titulo: string;
  nombreModel: string;
  clienteSeleccionado: Cliente;
  fechaInicio!: Date;
fechaFin!: Date;

  dataSource: MatTableDataSource<Reporte>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  pageSizeOptions = [3, 5, 10, 20, 50];
  mostrarColumnas = ['fecha', 'numeroCuenta', 'tipoCuenta', 'saldoInicial', 'estado','tipoMovimiento','valor','saldo'];

constructor(private clienteService: ClienteService, private service: MovimientoService) {
    this.titulo = 'Listado de Movimientos';
    this.nombreModel = Reporte.name;
  }

  ngOnInit() {
    this.clienteService.listar()
      .subscribe(clientes => {
        this.clientes = clientes;
      });
  }

  private iniciarPaginador() {
    this.dataSource = new MatTableDataSource<Reporte>(this.movimientos);
    this.dataSource.paginator = this.paginator;
    this.paginator._intl.itemsPerPageLabel = 'Registros por página';
  }

  onChange(event: any) {
    this.clienteSeleccionado = event.value;
  }

  buscarMovimientos(): void {

  if (!this.fechaInicio || !this.fechaFin || !this.clienteSeleccionado) {
    Swal.fire('Error', 'Debe seleccionar fechas y cliente', 'error');
    return;
  }

  this.service
    .reportMovimientosByClienteAndFecha(
      this.fechaInicio,
      this.fechaFin,
      this.clienteSeleccionado.id
    )
    .subscribe(r => {
      this.movimientos = r;
      this.iniciarPaginador();

      if (this.movimientos.length === 0) {
        Swal.fire(
          'Respuesta',
          `No existen movimientos para ${this.clienteSeleccionado.nombre}`,
          'info'
        );
      }
    });
  }

  descargarPdf(): void {

  this.service.descargarReportePdf(
    this.fechaInicio,
    this.fechaFin,
    this.clienteSeleccionado.id
  ).subscribe(blob => {

    const file = new Blob([blob], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-movimientos.pdf';
    a.click();

    window.URL.revokeObjectURL(url);
  });
}
}
