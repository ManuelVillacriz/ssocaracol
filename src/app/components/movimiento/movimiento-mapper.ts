import { Injectable } from "@angular/core";
import { Movimiento } from "../../models/movimiento/movimiento";
import { MovimientoRequestDto } from "../../models/movimiento/movimiento-request-dto";

@Injectable({
  providedIn: 'root'
})

export class MovimientoMapper {

  // 🔹 UI → REQUEST (Angular → Backend)
    toRequest(model: Movimiento): MovimientoRequestDto {
  
      return {        
        tipoMovimiento: model.tipoMovimiento?.id,
        valor: model.valor,
        cuenta: model.cuenta?.id
      };
    }
  
    // 🔹 RESPONSE → UI (Backend → Angular)
    toModel(rs: any): Movimiento {
  
      return {
        id: rs.id,        
        tipoMovimiento: rs.tipoMovimiento,
        valor: rs.valor,
        saldo: rs.saldo,
        fechaMovimiento: rs.fechaMovimiento,
        cuenta: rs.cuenta,
        descripcion: ''
      };
    }
  }
  

