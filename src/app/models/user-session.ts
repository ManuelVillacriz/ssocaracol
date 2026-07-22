export interface UserSession {
  id: string;            // Identificador único (ej: ID del usuario o email)
  username: string;      // Nombre de usuario o correo para mostrar en la interfaz
  accessToken: string;   // Token de acceso de este usuario
  refreshToken: string;  // Token de refresco de este usuario
  idToken: string;       // ID Token para logouts futuros
  loginType: 'credentials' | 'social'; // Tipo de login
}