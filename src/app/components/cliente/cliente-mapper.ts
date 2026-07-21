import { Injectable } from "@angular/core";
import { ClienteRequestDto } from "../../models/cliente/cliente-request-dto";
import { Cliente } from "../../models/cliente/cliente";

@Injectable({
  providedIn: 'root'
})

export class ClienteMapper {

  toRequest(model: Cliente): ClienteRequestDto {
   const fecha = model.fechaNacimiento
    ? new Date(model.fechaNacimiento)
    : null;

    
  return {
    nombre: model.nombre,
    apellido: model.apellido,
    genero: model.genero?.codigo,
    fechaNacimiento: fecha
      ? fecha.toISOString().split('T')[0]
      : null,
    tipoIdentificacion: model.tipoIdentificacion?.codigo,
    numeroIdentificacion: model.numeroIdentificacion,
    direccion: model.direccion,
    telefono: model.telefono,
    email: model.email,
    userName: model.userName,
    password: model.password
  };
}

 toModel(rs: any): Cliente {
  return { 
    id: rs.id,     
    nombre: rs.nombre,
    apellido: rs.apellido,
    genero: rs.genero,
    tipoIdentificacion: rs.tipoIdentificacion,
    fechaNacimiento: rs.fechaNacimiento ? new Date(rs.fechaNacimiento) : null,
    numeroIdentificacion: rs.numeroIdentificacion,
    direccion: rs.direccion,
    telefono: rs.telefono,
    email: rs.email,
    userName: rs.userName,
    descripcion: ''
  };
}
  
}