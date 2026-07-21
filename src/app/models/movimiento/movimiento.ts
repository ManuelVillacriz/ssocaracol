import { Cuenta } from "../cuenta/cuenta";
import { Generic } from "../generic";
import { TipoMovimiento } from "./tipo-movimiento";

export class Movimiento implements Generic{
  id!: number;  
  tipoMovimiento: TipoMovimiento;
  valor: number;
  saldo: number;
  fechaMovimiento: Date;
  cuenta: Cuenta;
  descripcion: string;  
}
