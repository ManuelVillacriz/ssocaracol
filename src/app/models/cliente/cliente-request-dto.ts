import { Genero } from "./genero";


export interface ClienteRequestDto {
  nombre: string;
  apellido: string;
  genero: string;
  fechaNacimiento: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  direccion: string;
  telefono: string;
  email: string;
  userName: string;
  password: string;
}
