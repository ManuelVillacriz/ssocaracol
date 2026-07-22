import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { SharedModule } from './shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ClienteComponent } from './components/cliente/cliente.component';
import { ClienteFormComponent } from './components/cliente/cliente-form.component';
import { MatSelectModule } from '@angular/material/select';
import { CuentaComponent } from './components/cuenta/cuenta.component';
import { CuentaFormComponent } from './components/cuenta/cuenta-form.component';
import { MovimientoComponent } from './components/movimiento/movimiento.component';
import { MovimientoFormComponent } from './components/movimiento/movimiento-form.component';
import { ReporteComponent } from './components/movimiento/reporte.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MonedaInputDirective } from './shared/moneda-input.directive';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SsoBridgeComponent } from './components/sso-bridge/sso-bridge.component';

// 1. Modifica la función para recibir el PLATFORM_ID
export function initializeKeycloak(keycloak: KeycloakService, platformId: object) {
  return () => {
    // Si no estamos en el navegador (sino en el servidor), saltamos la inicialización
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve(); 
    }

    // Si estamos en el navegador, inicializamos Keycloak de forma segura
     return keycloak.init({
      config: {
        url: 'http://localhost:8080/',
        realm: 'grupo-valorem',
        clientId: 'caracol'
      },
      initOptions: {
        onLoad: 'check-sso',        
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html'
      },
      loadUserProfileAtStartUp: false, 
      enableBearerInterceptor: true, 
      bearerExcludedUrls: ['/assets', '/clients/public']
    });
  };
}

@NgModule({
  declarations: [
    AppComponent,
    ClienteComponent,
    ClienteFormComponent,
    CuentaComponent,
    CuentaFormComponent,
    MovimientoComponent,
    MovimientoFormComponent,
    ReporteComponent,
    HomeComponent,
    LoginComponent,
    SsoBridgeComponent   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatSnackBarModule,
    SharedModule,        
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    MatPaginatorModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatExpansionModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatSelectModule,
    MatNativeDateModule,
    MatDatepickerModule,
    KeycloakAngularModule    
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
    useFactory: initializeKeycloak,
    multi: true,
    deps: [KeycloakService, PLATFORM_ID]

    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
