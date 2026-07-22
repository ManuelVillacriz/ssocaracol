import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private sessionService = inject(SessionService);
  
  username: string = '';
  
  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        this.router.navigate(['/login']);
        return;
      }

      // 1. Obtener la sesión activa desde el SessionService
      const sesionActiva = this.sessionService.getActiveSession();

      if (sesionActiva && sesionActiva.username) {
        // Formateamos para quitar el dominio del correo si es un login social
        this.username = this.formatUsername(sesionActiva.username);
        return;
      }
    
      // 2. Fallback de decodificación si no hay sesión activa guardada
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rawName = payload.given_name || payload.preferred_username || payload.name || payload.email || 'Usuario';
        this.username = this.formatUsername(rawName);
      } catch (error) {
        console.warn('Error al decodificar JWT en HomeComponent:', error);
        this.username = 'Usuario';
      }
    }
  }

  /**
   * Si el usuario es un correo electrónico, extrae solo el nombre antes del '@'
   */
  private formatUsername(rawUsername: string): string {
    if (!rawUsername) return 'Usuario';
    
    // Si contiene '@', tomamos la parte previa
    if (rawUsername.includes('@')) {
      const namePart = rawUsername.split('@')[0];
      // Opcional: Capitalizar la primera letra (ej: 'manuelvillacriz' -> 'Manuelvillacriz')
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }

    return rawUsername;
  }
}