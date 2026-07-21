import { MediaMatcher } from '@angular/cdk/layout';
import { OverlayContainer } from '@angular/cdk/overlay';
import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environments';

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

  username: string = 'Invitado';
  isDark = false;

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
      
      // 1. Obtener los datos del usuario de manera segura
      await this.loadUserData();

      // 2. Cargar el tema preferido
      const saved = localStorage.getItem('theme');
      this.isDark = saved === 'dark';
      document.body.classList.toggle('dark-theme', this.isDark);
    }
  }

  /**
   * Carga el nombre del usuario validando la sesión
   */
  private async loadUserData(): Promise<void> {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.username = 'Invitado';
      return;
    }

    try {
      // Intentamos obtener el perfil desde Keycloak Service si ya está sincronizado
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      if (isLoggedIn) {
        const userProfile = await this.keycloakService.loadUserProfile();
        this.username = userProfile.firstName || this.keycloakService.getUsername() || 'Usuario';
      } else {
        // Alternativa de rescate: Decodificamos el JWT guardado en localStorage para pintar el nombre de inmediato
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Keycloak guarda habitualmente el nombre en 'given_name', 'name' o 'preferred_username'
        this.username = payload.given_name || payload.name || payload.preferred_username || 'Usuario';
      }
    } catch (error) {
      console.error('Error cargando el usuario en sidenav:', error);
      this.username = 'Usuario';
    }
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
  async logout(): Promise<void> {
  if (isPlatformBrowser(this.platformId)) {
    // 1. Guardamos las URLs de rebote que ya tienes configuradas
    const miOrigen = window.location.origin;     // Ej: http://localhost:4200
    const urlVecina = environment.appVecinaUrl; // Ej: http://localhost:4300
    
    // 2. Extraemos el id_token ANTES de borrar el localStorage.
    // Las versiones modernas de Keycloak exigen este token para cerrar la sesión del servidor de forma segura.
    const idTokenHint = localStorage.getItem('id_token');

    // 3. Limpiamos nuestros tokens locales
    localStorage.clear();
    try {
      await this.keycloakService.clearToken();
    } catch (e) {}

    // 4. Construimos la URL de limpieza para el vecino (Tu lógica original intacta)
    const urlLimpiezaVecino = `${urlVecina}/login?logout_sso=true&return_to=${encodeURIComponent(miOrigen)}`;

    // 5. URL Oficial de Keycloak para destruir la sesión del servidor
    const keycloakLogoutUrl = 'http://localhost:8080/realms/grupo-valorem/protocol/openid-connect/logout';

    if (idTokenHint) {
      // Si tenemos el ID Token, se lo enviamos a Keycloak junto con la URL de redirección final.
      // Esto destruirá la sesión en el puerto 8080 y luego mandará al usuario a limpiar al vecino.
      window.location.href = `${keycloakLogoutUrl}?id_token_hint=${idTokenHint}&post_logout_redirect_uri=${encodeURIComponent(urlLimpiezaVecino)}`;
    } else {
      // Si por alguna razón no hay id_token, aplicamos tu rebote manual directo al vecino como fallback
      window.location.href = urlLimpiezaVecino;
    }
  }
}
}