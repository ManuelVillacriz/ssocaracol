import { Generic } from "../generic";

export class Reporte implements Generic{
  id: number;
   fecha: Date;
   cliente:string;
   numeroCuenta:string;
   tipoCuenta:string;
   saldoInicial:number;
   estado:string;
   tipoMovimiento: string;
   valor:string;
   saldo:number;
  descripcion: string = 'oie';
}
