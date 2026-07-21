import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private keycloakService = inject(KeycloakService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  username: string = '';
  
  async ngOnInit(): Promise<void> {
    // Solo ejecutamos si estamos del lado del cliente (Navegador)
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        this.router.navigate(['/login']);
        return;
      }
    
      try {
        // 1. Intentamos verificar primero el estado con KeycloakService
        const isLoggedIn = await this.keycloakService.isLoggedIn();
        
        if (isLoggedIn) {
          const userProfile = await this.keycloakService.loadUserProfile();
          this.username = userProfile.firstName || this.keycloakService.getUsername() || 'Usuario';
        } else {
          // 2. ¡PLAN B (Inmediato)! Si Keycloak aún no se da por enterado, decodificamos el JWT local
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Buscamos el nombre en los campos comunes donde Keycloak guarda el usuario/nombre
          this.username = payload.given_name || payload.name || payload.preferred_username || 'Usuario';
        }
      } catch (error) {
        console.warn('Error asíncrono con KeycloakService, usando fallback de JWT local:', error);
        
        // 3. ¡PLAN C (Seguridad)! Si el servicio de Keycloak falla por completo en la promesa, decodificamos el JWT igual
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.username = payload.given_name || payload.name || payload.preferred_username || 'Usuario';
        } catch (jwtError) {
          this.username = 'Usuario';
        }
      }
    }
  }
}