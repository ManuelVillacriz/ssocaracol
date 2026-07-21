import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from './environments/environments';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'bp';
  showLayout = true; // Controla si se renderiza el sidenav
  private platformId = inject(PLATFORM_ID);

  private router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {      
      this.showLayout = !event.urlAfterRedirects.includes('/login');
    });

    if (isPlatformBrowser(this.platformId)) {
      
      // ESCUCHAR SOLICITUDES DE LA APP VECINA
      window.addEventListener('message', (event) => {
        // Validamos que el mensaje provenga únicamente de la URL de nuestra app vecina configurada
        if (event.origin === environment.appVecinaUrl) {
          if (event.data === 'REQUEST_TOKEN') {
            const token = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            const idToken = localStorage.getItem('id_token');
            
            if (token) {
              // Respondemos enviándole los tokens de vuelta
              event.source?.postMessage({
                type: 'SEND_TOKEN',
                access_token: token,
                refresh_token: refreshToken,
                id_token: idToken
              }, { targetOrigin: event.origin });
            }
          }
        }
      });

    }
  }
  

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 2000, 
    });
  } 
}