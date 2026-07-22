import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // <-- IMPORTANTE
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environments';
import { SessionService } from '../../services/session.service';
import { UserSession } from '../../models/user-session';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // Inyecciones modernas con inject()
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private keycloakService = inject(KeycloakService);
  private platformId = inject(PLATFORM_ID);
  private sessionService = inject(SessionService);

  // Credenciales y estados
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  brand: 'caracol' | 'ditu' = 'caracol';

  private keycloakTokenUrl = 'http://localhost:8080/realms/grupo-valorem/protocol/openid-connect/token'; 
  private clientId = 'ditu'; 

  ngOnInit(): void {

  if (isPlatformBrowser(this.platformId)) {
    this.detectBrand();

    // 1. Verificamos si en la URL viene el parámetro 'code' que envía Google tras autenticarse
    const urlParams = new URLSearchParams(window.location.search);
    const hasCode = urlParams.has('code');

    if (hasCode) {
      // Si viene el código, procesamos la autenticación de Google de forma prioritaria
      this.checkOAuthCallback();
    } else {
      // 2. Si NO viene el código, ejecutamos tus flujos de SSO normales e intactos
      //this.checkSilentSSO();
      this.checkAlternativeSSO();
    }
  }
}
  checkAlternativeSSO() {
  if (!isPlatformBrowser(this.platformId)) return;

  const urlParams = new URLSearchParams(window.location.search);
  const ssoToken = urlParams.get('sso_token');
  const ssoRefresh = urlParams.get('sso_refresh');
  const ssoId = urlParams.get('sso_id');
  const ssoSessions = urlParams.get('sso_sessions'); // ➔ CAPTURAMOS LA LISTA MULTICUENTA VECINA
  const requestSSO = urlParams.get('request_sso');
  const returnTo = urlParams.get('return_to');
  const ssoFailed = urlParams.get('sso_failed');
  const logoutSso = urlParams.get('logout_sso'); // Capturamos la orden de cierre de sesión
  const addAccount = urlParams.get('add_account');
  
  // CASO ESPECIAL: El usuario quiere agregar una nueva cuenta.
  // Nos quedamos en el login local de Angular y NO disparamos rebotes al vecino.
  if (addAccount === 'true') {
    // Detenemos cualquier redirección automática para mostrar la pantalla de login limpia
    return; 
  }

  // CASO LOGOUT: El vecino me ordenó cerrar sesión.
  if (logoutSso === 'true') {
    // 1. Limpiamos nuestra sesión local
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('active_session_id');
    try {
      this.keycloakService.clearToken();
    } catch (e) {}

    // 2. Si el vecino nos dijo a dónde volver (return_to), lo devolvemos de inmediato
    if (returnTo) {
      // Volvemos al login de quien originó el logout, marcando 'sso_failed=true'
      // para que cuando llegue allí no intente pedirnos tokens otra vez.
      window.location.href = `${decodeURIComponent(returnTo)}/login?sso_failed=true`;
    } else {
      // Respaldo por si acaso: si no hay returnTo, nos quedamos en nuestro login
      this.router.navigate(['/login'], { replaceUrl: true });
    }
    return;
  }

  // CASO A: Vengo rebotado de mi vecino con tokens válidos.
  if (ssoToken) {
    // ➔ SINCRONIZACIÓN MULTICUENTA: Si el vecino nos envía la lista completa, la hidratamos primero
    if (ssoSessions) {
      try {
        const sesionesDecodificadas = JSON.parse(decodeURIComponent(ssoSessions));
        if (Array.isArray(sesionesDecodificadas) && sesionesDecodificadas.length > 0) {
          localStorage.setItem('app_multi_sessions', JSON.stringify(sesionesDecodificadas));
        }
      } catch (e) {
        console.warn('Error al sincronizar lista multicuenta desde el vecino:', e);
      }
    }

    let ssoUser = 'Usuario SSO';
    try {
      const payload = JSON.parse(atob(ssoToken.split('.')[1]));
      ssoUser = payload.preferred_username || payload.email || payload.given_name || 'Usuario SSO';
    } catch (e) {}

    // ➔ GUARDADO MULTICUENTA: Agregamos o activamos la cuenta enviada por el vecino
    this.guardarNuevaSesion(
      ssoUser,
      ssoToken,
      ssoRefresh || '',
      ssoId || '',
      'credentials'
    );
    
    window.location.href = `${window.location.origin}/home`;
    return;
  }

  // CASO B: Mi vecino me está pidiendo el token.
  if (requestSSO === 'true' && returnTo) {
    const miToken = localStorage.getItem('access_token');
    
    if (miToken) {
      const miRefresh = localStorage.getItem('refresh_token') || '';
      const miId = localStorage.getItem('id_token') || '';
      
      // ➔ Le adjuntamos al vecino nuestro arreglo completo de cuentas locales
      const misSesiones = localStorage.getItem('app_multi_sessions') || '[]';

      window.location.href = `${decodeURIComponent(returnTo)}/login` +
        `?sso_token=${miToken}` +
        `&sso_refresh=${miRefresh}` +
        `&sso_id=${miId}` +
        `&sso_sessions=${encodeURIComponent(misSesiones)}`;
    } else {
      window.location.href = `${decodeURIComponent(returnTo)}/login?sso_failed=true`;
    }
    return;
  }

  // CASO C: Ya tengo sesión local activa.
  const tokenLocal = localStorage.getItem('access_token');
  if (tokenLocal) {
    this.router.navigate(['/home']);
    return;
  }

  // CASO D: No tengo sesión local y no he fallado previamente. Pregunto al vecino.
  if (ssoFailed !== 'true') {
    const miOrigen = window.location.origin;
    const urlVecina = environment.appVecinaUrl;
    
    window.location.href = `${urlVecina}/login?request_sso=true&return_to=${encodeURIComponent(miOrigen)}`;
  }
}

  private detectBrand(): void {
    const hostname = window.location.hostname;
    // Detección automática por dominio
    if (hostname.includes('ditu') || hostname.includes('localhost')) {
      this.brand = 'ditu';
    } else {
      this.brand = 'caracol';
    }

    // Sobrescribir por query parameter opcional (?brand=caracol)
    this.route.queryParams.subscribe(params => {
      if (params['brand'] === 'caracol' || params['brand'] === 'ditu') {
        this.brand = params['brand'];
      }
    });
  }

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Parámetros en formato x-www-form-urlencoded
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', this.clientId)
      .set('username', this.username)
      .set('password', this.password)
      .set('scope', 'openid');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this.http.post<any>(this.keycloakTokenUrl, body.toString(), { headers }).subscribe({
      next: async (response) => {
        if (isPlatformBrowser(this.platformId)) {
          
          // ➔ GUARDADO MULTICUENTA: Registramos la nueva sesión sin borrar las anteriores
          this.guardarNuevaSesion(
            this.username, // Usa el username ingresado en el formulario
            response.access_token,
            response.refresh_token,
            response.id_token,
            'credentials'
          );
          
          try {
            // Inicializar Keycloak de forma interna con las nuevas credenciales
            await this.keycloakService.init({
              config: {
                url: 'http://localhost:8080/',
                realm: 'grupo-valorem',
                clientId: 'ditu'
              },
              initOptions: {
                token: response.access_token,
                refreshToken: response.refresh_token,
                idToken: response.id_token,
                onLoad: 'check-sso'
              }
            });
          } catch (e) {
            console.warn("Keycloak ya estaba instanciado.");
          }
        }
        
        this.isLoading = false;
        // Redirigir al home ya autenticado
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error de autenticación:', err);
        if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Ocurrió un error al conectar con el servidor.';
        }
      }
    });
  }

  // Añade este método en tu login.component.ts
onSocialLogin(provider: string): void {
  this.isLoading = true;
  this.errorMessage = '';

  if (isPlatformBrowser(this.platformId)) {
    // 1. A dónde regresará el usuario (tu componente login ya sabrá qué hacer si se inicializa autenticado)
    const redirectUri = `${window.location.origin}/login`;

    // 2. Endpoint estándar de autenticación de Keycloak
    const authUrl = 'http://localhost:8080/realms/grupo-valorem/protocol/openid-connect/auth';

    // 3. Construimos la URL agregando 'kc_idp_hint' para que salte directo a Google
    const keycloakIdpUrl = `${authUrl}` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid` +
      `&kc_idp_hint=${provider}`; // <-- Aquí ocurre la redirección directa a Google
      `&prompt=select_account`;

    // Redirigimos al usuario
    window.location.href = keycloakIdpUrl;
  }
}

// Agrega este método en tu login.component.ts
private checkOAuthCallback(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    this.isLoading = true;

    // Intercambiamos el código de autorización por los tokens de acceso
    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('client_id', this.clientId)
      .set('code', code)
      .set('redirect_uri', `${window.location.origin}/login`)
      .set('scope', 'openid');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this.http.post<any>(this.keycloakTokenUrl, body.toString(), { headers }).subscribe({
      next: async (response) => {
        
        // ➔ Extraemos el username/email del JWT de Google para identificarlo en la lista
        let socialUsername = 'Usuario Google';
        try {
          const payload = JSON.parse(atob(response.access_token.split('.')[1]));
          socialUsername = payload.email || payload.preferred_username || payload.given_name || 'Usuario Google';
        } catch (e) {}

        // ➔ GUARDADO MULTICUENTA: Registramos la nueva sesión social
        this.guardarNuevaSesion(
          socialUsername,
          response.access_token,
          response.refresh_token,
          response.id_token,
          'social'
        );

        try {
          // Inicializamos Keycloak internamente con los nuevos tokens
          await this.keycloakService.init({
            config: {
              url: 'http://localhost:8080/',
              realm: 'grupo-valorem',
              clientId: 'caracol'
            },
            initOptions: {
              token: response.access_token,
              refreshToken: response.refresh_token,
              idToken: response.id_token,
              onLoad: 'check-sso'
            }
          });
        } catch (e) {
          console.warn("Keycloak ya estaba instanciado.");
        }

        this.isLoading = false;
        // Limpiamos los query params de la URL y vamos al Home
        this.router.navigate(['/home'], { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al procesar el login de Google:', err);
        this.errorMessage = 'No se pudo completar el inicio de sesión con Google.';
      }
    });
  }
}

// De aqui en adelante la implementacion de autenticacion multicuenta

guardarNuevaSesion(username: string, accessToken: string, refreshToken: string, idToken: string, loginType: 'credentials' | 'social'): void {
  console.log('guardarNuevaSesion')
  const nuevaSesion: UserSession = {
    id: username, // O el sub/UUID extraído del token
    username: username,
    accessToken: accessToken,
    refreshToken: refreshToken || '',
    idToken: idToken || '',
    loginType: loginType
  };
  this.sessionService.saveSession(nuevaSesion);
}

}