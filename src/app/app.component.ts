import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';
import { SessionService } from './services/session.service'; // Asegura la ruta correcta de tu SessionService
import { environment } from './environments/environments';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'bp';
  showLayout = true;

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private _snackBar = inject(MatSnackBar);
  private sessionService = inject(SessionService);

  ngOnInit(): void {
    // Manejo de la visibilidad del layout según la ruta actual
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {      
      this.showLayout = !event.urlAfterRedirects.includes('/login');
    });

    // 🚨 REGLA CLAVE: Solo sincronizamos si estamos en la ventana principal (window.self === window.top).
    // Si la app está corriendo dentro de un iframe (ej: /sso-bridge), no debe sincronizar ni crear más iframes.
    if (isPlatformBrowser(this.platformId) && window.self === window.top) {

      // 1. Sincronizamos los usuarios inmediatamente al cargar/recargar la página
      this.sessionService.sincronizarConVecino();

      // 2. Sincronizamos también cuando el usuario regresa o hace clic en la pestaña
      window.addEventListener('focus', () => {
        this.sessionService.sincronizarConVecino();
      });

    }
  }

  openSnackBar(message: string, action: string): void {
    this._snackBar.open(message, action, {
      duration: 2000, 
    });
  }
}