import { Generic } from "../generic";
import { Genero } from "./genero";
import { TipoIdentificacion } from "./tipo-identificacion";

export class Cliente implements Generic {
  id!: number;  
  nombre!: string;
  apellido!: string;
  genero?: Genero;
  fechaNacimiento?: Date;
  tipoIdentificacion?: TipoIdentificacion;
  numeroIdentificacion?: string;
  direccion?: string;
  telefono?: string;
  email?: string; 
  userName?: string;
  descripcion!: string;
  password?: string;
}
