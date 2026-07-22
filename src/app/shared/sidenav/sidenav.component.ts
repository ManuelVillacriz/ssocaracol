import { MediaMatcher } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environments';
import { SessionService } from '../../services/session.service';
import { UserSession } from '../../models/user-session';

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnInit {
mobileQuery: MediaQueryList;
  
  // Inyecciones modernas
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private sessionService = inject(SessionService);

  username: string = 'Invitado';
  isDark = false;

  // Lista de sesiones disponibles y la sesión activa en esta pestaña
  cuentasDisponibles: UserSession[] = [];
  sesionActiva: UserSession | null = null;
  mostrarListaCuentas: boolean = false; // Toggle para desplegar la lista

  menuNav = [
    {name: "Home", route: "home", icon: "home"},
    {name: "Usuarios", route: "cliente", icon: "person_add"},
    {name: "Programas", route: "cuenta", icon: "account_balance_wallet"},
    {name: "Contenido en vivo", route: "movimiento", icon: "swap_horiz"},
    {name: "Noticias", route: "reporte", icon: "picture_as_pdf"}
  ]

  constructor(media: MediaMatcher, private overlay: OverlayContainer) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
  }

async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      // Carga inicial y suscripción reactiva a cambios de sesión
      //this.cargarSesiones();
      this.sessionService.sessions$.subscribe(() => {
        this.cargarSesiones();
      });

      await this.loadUserData();

      const saved = localStorage.getItem('theme');
      this.isDark = saved === 'dark';
      document.body.classList.toggle('dark-theme', this.isDark);
    }
  }

  /**
   * Carga el nombre del usuario validando la sesión
   */
  private async loadUserData(): Promise<void> {
    // ➔ PRIORIDAD 1: Si tenemos una sesión activa seleccionada en nuestro SessionService, usamos su nombre
    if (this.sesionActiva && this.sesionActiva.username) {
      this.username = this.sesionActiva.username;
      return;
    }

    // ➔ PRIORIDAD 2: Respaldo por si se limpia la sesión activa
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.username = 'Invitado';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.username = payload.preferred_username || payload.given_name || payload.name || payload.email || 'Usuario';
    } catch (error) {
      console.error('Error cargando el usuario en sidenav:', error);
      this.username = 'Usuario';
    }
    // const token = localStorage.getItem('access_token');
    
    // if (!token) {
    //   this.username = 'Invitado';
    //   return;
    // }

    // try {
    //   // Intentamos obtener el perfil desde Keycloak Service si ya está sincronizado
    //   const isLoggedIn = await this.keycloakService.isLoggedIn();
    //   if (isLoggedIn) {
    //     const userProfile = await this.keycloakService.loadUserProfile();
    //     this.username = userProfile.firstName || this.keycloakService.getUsername() || 'Usuario';
    //   } else {
    //     // Alternativa de rescate: Decodificamos el JWT guardado en localStorage para pintar el nombre de inmediato
    //     const payload = JSON.parse(atob(token.split('.')[1]));
    //     // Keycloak guarda habitualmente el nombre en 'given_name', 'name' o 'preferred_username'
    //     this.username = payload.given_name || payload.name || payload.preferred_username || 'Usuario';
    //   }
    // } catch (error) {
    //   console.error('Error cargando el usuario en sidenav:', error);
    //   this.username = 'Usuario';
    // }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    }
  }

  /**
   * Cierre de sesión adaptado para flujo empresarial directo (ROPC)
   */
  // En SidenavComponent.ts

async logout(): Promise<void> {
  if (!isPlatformBrowser(this.platformId)) return;

  const miOrigen = window.location.origin;
  const urlVecina = environment.appVecinaUrl;
  const idTokenHint = localStorage.getItem('id_token');

  // 1. Si hay una sesión activa, la removemos del arreglo multicuenta
  if (this.sesionActiva) {
    const sesionesRestantes = this.cuentasDisponibles.filter(s => s.id !== this.sesionActiva?.id);
    localStorage.setItem('app_multi_sessions', JSON.stringify(sesionesRestantes));

    // Si quedan otras cuentas guardadas (ej: Jimmy)
    if (sesionesRestantes.length > 0) {
      const siguienteCuenta = sesionesRestantes[0];
      
      // Establecemos la siguiente cuenta como activa
      localStorage.setItem('active_session_id', siguienteCuenta.id);
      
      // ASIGNAMOS SUS TOKENS para que el AuthGuard no lo mande al login
      if (siguienteCuenta.accessToken) localStorage.setItem('access_token', siguienteCuenta.accessToken);
      if (siguienteCuenta.refreshToken) localStorage.setItem('refresh_token', siguienteCuenta.refreshToken);
      if (siguienteCuenta.idToken) localStorage.setItem('id_token', siguienteCuenta.idToken);

      // Recargamos la app como la siguiente cuenta SIN ir a Keycloak
      window.location.href = '/';
      return; // 🛑 DETENEMOS AQUÍ para no borrar los tokens ni llamar a Keycloak
    } else {
      localStorage.removeItem('active_session_id');
    }
  }

  // 2. Limpieza de tokens (Solo se ejecuta si NO quedaban más cuentas)
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('id_token');

  // 3. Limpieza de Keycloak
  try {
    await this.keycloakService.clearToken();
  } catch (e) {
    console.error('Error al limpiar token de Keycloak', e);
  }

  // 4. Redirección a Keycloak
  const urlLimpiezaVecino = `${urlVecina}/login?logout_sso=true&return_to=${encodeURIComponent(miOrigen)}`;
  const keycloakLogoutUrl = 'http://localhost:8080/realms/grupo-valorem/protocol/openid-connect/logout';

  if (idTokenHint) {
    window.location.href = `${keycloakLogoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(urlLimpiezaVecino)}`;
  } else {
    window.location.href = urlLimpiezaVecino;
  }
}
// De aui en aedlante implementacion multicuenta

cargarSesiones(): void {
    this.cuentasDisponibles = this.sessionService.getSessions();
    this.sesionActiva = this.sessionService.getActiveSession();
    
    // if (this.sesionActiva) {
    //   this.username = this.sesionActiva.username;
    // }
  }

  // Despliega o esconde la lista de cuentas
  toggleMenuCuentas(): void {
    this.mostrarListaCuentas = !this.mostrarListaCuentas;
  }

  // Método estrella: Conmuta de usuario al hacer clic en otra cuenta
  
  // En sidenav.component.ts (4200 y 4300)

 // En sidenav.component.ts (En 4200 y en 4300)

cambiarDeCuenta(cuentaSeleccionada: UserSession): void {
  if (isPlatformBrowser(this.platformId)) {
    // 1. Si hace clic en la misma cuenta que ya está activa, no hacemos nada
    if (this.sesionActiva?.id === cuentaSeleccionada.id) return;

    // 2. Activamos la sesión seleccionada localmente en nuestro SessionService.
    // Esto escribe 'access_token', 'refresh_token', 'id_token' y 'active_session_id'
    this.sessionService.setActiveSession(cuentaSeleccionada);

    // 3. Recargamos la aplicación EN EL MISMO PUERTO (permanece en 4200 o 4300)
    // Angular re-inicializará los servicios y el Home con el nuevo usuario sin cambiar de URL.
    window.location.reload();
  }
}

  agregarOtraCuenta(): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Construimos la URL con el parámetro 'add_account=true'
      const loginUrl = `${window.location.origin}/login?add_account=true`;

      // 2. Usamos window.open con '_blank' para forzar la apertura en una pestaña nueva
      window.open(loginUrl, '_blank');
    }
  }

  /**
   * Método a vincular con la 'X' o botón de eliminar en el HTML desplegable de cuentas
   */
  cerrarSesionUsuario(event: Event, cuentaAEliminar: any): void {
  // 1. Detenemos cualquier burbujeo hacia el div padre (evita disparar cambiarDeCuenta)
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  // Normalizamos el ID
  const cuentaId = typeof cuentaAEliminar === 'string' ? cuentaAEliminar : cuentaAEliminar?.id;
  if (!cuentaId) return;

  // 2. Si la cuenta a eliminar es la ACTIVA actualmente
  // if (this.sesionActiva && cuentaId === this.sesionActiva.id) {
  //   this.logout(); // Ejecuta la lógica de logout
  //   return;
  // }

  // 3. Si es una cuenta INACTIVA:
  // Delegamos la eliminación al servicio para que actualice la lista y sincronice al vecino
  if (this.sessionService) {
    const resultado = this.sessionService.removeSession(cuentaId);
    
    // Refrescamos la lista local del componente para que Angular redibuje el *ngFor
    this.cuentasDisponibles = this.sessionService.getSessions();
    
    console.log('✅ Cuenta inactiva eliminada y vecina notificada:', resultado);
  }
}

  // 2. Método para el nuevo botón "Cerrar todas las sesiones"
cerrarTodasLasSesiones(): void {
  this.sessionService.logoutAll();
}

// async logoutAll(): Promise<void> {
//   if (!isPlatformBrowser(this.platformId)) return;

//   // Limpiamos absolutamente todo el almacenamiento multicuenta
//   localStorage.removeItem('app_multi_sessions');
//   localStorage.removeItem('active_session_id');

//   // Reutilizamos el flujo de logout principal para tumbar la sesión en Keycloak
//   await this.logout();
// }



}