import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appMonedaInput]'
})
export class MonedaInputDirective implements OnInit {

  private _modelo: any;

  @Input()
  set modelo(value: any) {
    this._modelo = value;
    this.actualizarVista();
  }

  get modelo(): any {
    return this._modelo;
  }

  @Input() campo!: string;
  @Input() maxDigitos: number = 10;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.actualizarVista();
  }

  // 🔹 Permitir solo números
  @HostListener('keypress', ['$event'])
  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    if (charCode >= 48 && charCode <= 57) return;

    const teclasPermitidas = [8, 37, 39, 46];
    if (teclasPermitidas.includes(charCode)) return;

    event.preventDefault();
  }

  // 🔹 Formateo cuando el usuario escribe
  @HostListener('input', ['$event'])
  formatearMoneda(event: any) {
    let valor = event.target.value.replace(/[^\d]/g, '');

    if (this.maxDigitos && valor.length > this.maxDigitos) {
      valor = valor.substring(0, this.maxDigitos);
    }

    if (!valor) {
      if (this.modelo && this.campo) {
        this.modelo[this.campo] = 0;
      }
      this.el.nativeElement.value = '';
      return;
    }

    const numero = parseInt(valor, 10);

    if (this.modelo && this.campo) {
      this.modelo[this.campo] = numero;
    }

    this.el.nativeElement.value = this.formatearValor(numero);
  }

  // 🔹 Bloquear pegado inválido
  @HostListener('paste', ['$event'])
  bloquearPegado(event: ClipboardEvent) {
    const texto = event.clipboardData?.getData('text') || '';

    if (!/^\d+$/.test(texto)) {
      event.preventDefault();
    }
  }

  // 🔹 Formatear al salir del input
  @HostListener('blur')
  onBlur() {
    if (!this.modelo || !this.campo) return;

    const valor = this.modelo[this.campo];

    if (valor != null) {
      this.el.nativeElement.value = this.formatearValor(valor);
    }
  }

  // 🔹 NUEVA función SOLO para formatear números
  private formatearValor(numero: number): string {
    return Number(numero).toLocaleString('es-CO');
  }

  // 🔹 Cargar valor inicial (cuando editas)
  private actualizarVista() {
    if (!this.modelo || !this.campo) return;

    const valor = this.modelo[this.campo];

    if (valor != null) {
      this.el.nativeElement.value = this.formatearValor(valor);
    }
  }
}
/*import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appMonedaInput]'
})
export class MonedaInputDirective {

  @Input() modelo: any;      // objeto (ej: model)
  @Input() campo!: string;   // nombre del campo (ej: 'saldoInicial')
  @Input() maxDigitos: number = 10; 

  constructor(private el: ElementRef) {}

  @HostListener('keypress', ['$event'])
  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;

    if (charCode >= 48 && charCode <= 57) return;

    const teclasPermitidas = [8, 37, 39, 46];
    if (teclasPermitidas.includes(charCode)) return;

    event.preventDefault();
  }

  @HostListener('input', ['$event'])
  formatearMoneda(event: any) {
    let valor = event.target.value.replace(/[^\d]/g, '');

    // 👉 limitar cantidad de dígitos
    if (this.maxDigitos && valor.length > this.maxDigitos) {
      valor = valor.substring(0, this.maxDigitos);
    }

    if (!valor) {
      this.modelo[this.campo] = 0;
      this.el.nativeElement.value = '';
      return;
    }

    const numero = parseInt(valor, 10);

    this.modelo[this.campo] = numero;
    this.el.nativeElement.value = numero.toLocaleString('es-CO');
  }

  @HostListener('paste', ['$event'])
  bloquearPegado(event: ClipboardEvent) {
    const texto = event.clipboardData?.getData('text') || '';

    if (!/^\d+$/.test(texto)) {
      event.preventDefault();
    }
  }

  @HostListener('blur')
  onBlur() {
    const valor = this.modelo?.[this.campo];

    if (valor) {
      this.el.nativeElement.value = Number(valor).toLocaleString('es-CO');
    }
  }
}*/
