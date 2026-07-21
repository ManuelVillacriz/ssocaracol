import { Injectable } from "@angular/core";
import { Cuenta } from "../../models/cuenta/cuenta";
import { CuentaRequestDto } from "../../models/cuenta/cuenta-request-dto";

@Injectable({
  providedIn: 'root'
})

export class CuentaMapper {


  // 🔹 UI → REQUEST (Angular → Backend)
  toRequest(model: Cuenta): CuentaRequestDto {

    return {
      numeroCuenta: model.numeroCuenta,
      tipoCuenta: model.tipoCuenta?.id,
      saldoInicial: model.saldoInicial,
      cliente: model.cliente?.id
    };
  }

  // 🔹 RESPONSE → UI (Backend → Angular)
  toModel(rs: any): Cuenta {

    return {
      id: rs.id,
      numeroCuenta: rs.numeroCuenta,
      tipoCuenta: rs.tipoCuenta,
      cliente: rs.cliente,
      saldoInicial: rs.saldoInicial,
      descripcion: rs.numeroCuenta,
      fechaCreacion: rs.fechaCreacion
    };
  }
}
