import { Cliente } from "../cliente/cliente";
import { Generic } from "../generic";
import { TipoCuenta } from "./tipo-cuenta";

export class Cuenta implements Generic{
  id!: number;  
  numeroCuenta?: string;
  tipoCuenta?: TipoCuenta;
  saldoInicial?: number;
  cliente?: Cliente;
  descripcion: string;  
  fechaCreacion: Date;
}
