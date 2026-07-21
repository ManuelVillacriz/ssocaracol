import { OnInit, Directive } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2'
import { Generic } from '../models/generic';
import { CommonService } from '../services/common.service';

@Directive()
export abstract class CommonFormComponent<E extends Generic,S extends CommonService<E>> implements OnInit {

  titulo: string;
  model: E;
  error: any;
  protected redirect: string;
  protected nombreModel: string;

  constructor(protected service: S,
    protected router: Router,
    protected route: ActivatedRoute){}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id: number = +params.get('id');
      if(id){
        this.service.ver(id).subscribe(model => {
          this.model = model;
          this.titulo = 'Editar ' + this.nombreModel;

           this.onModelLoaded(model);
        });
      }
    })
  }

  public crear(): void {
  this.service.crear(this.model).subscribe({
    next: (model) => {
      console.log(model);
      Swal.fire('Nuevo:', `${this.nombreModel} ${model.descripcion} creado con éxito`, 'success');
      this.router.navigate([this.redirect]);
    },
    error: (err) => {
      console.log(err);

      if (err.status === 400) {

        // 🟢 Caso 1: error de negocio
        if (err.error?.error) {
          this.error = err.error.error;

          Swal.fire('Error', this.error, 'error');
        } 
        // 🔵 Caso 2: errores de validación (mapa)
        else if (typeof err.error === 'object') {
          this.error = err.error; // 👈 importante (para pintar en inputs)
          console.log('Errores de validación:', this.error);
        } 
        // 🔴 fallback
        else {
          this.error = 'Error inesperado';
          Swal.fire('Error', this.error, 'error');
        }
      }
    }
  });
}

  public editar(): void {
  this.service.editar(this.model).subscribe({
    next: (model) => {
      console.log(model);
      Swal.fire('Modificado:', `${this.nombreModel} ${model.descripcion} editado con éxito`, 'success');
      this.router.navigate([this.redirect]);
    },
    error: (err) => {
      console.log(err);

      if (err.status === 400) {

        // 🟢 Error de negocio (string)
        if (err.error?.error) {
          this.error = err.error.error;

          Swal.fire('Error', this.error, 'error');
        } 
        // 🔵 Error de validación (mapa de campos)
        else if (typeof err.error === 'object') {
          this.error = err.error;
          console.log('Errores de validación:', this.error);
        } 
        // 🔴 fallback
        else {
          this.error = 'Error inesperado';
          Swal.fire('Error', this.error, 'error');
        }
      }
    }
  });
}
// 🔥 AGREGA ESTO
protected onModelLoaded(model: E): void {}
}
