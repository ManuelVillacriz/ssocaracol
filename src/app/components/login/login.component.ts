import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // <-- IMPORTANTE
import { Router, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../environments/environments';

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
  const requestSSO = urlParams.get('request_sso');
  const returnTo = urlParams.get('return_to');
  const ssoFailed = urlParams.get('sso_failed');
  const logoutSso = urlParams.get('logout_sso'); // Capturamos la orden de cierre de sesión

  // CASO LOGOUT: El vecino me ordenó cerrar sesión.
  if (logoutSso === 'true') {
    // 1. Limpiamos nuestra sesión local
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
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
    localStorage.setItem('access_token', ssoToken);
    localStorage.setItem('refresh_token', ssoRefresh || '');
    localStorage.setItem('id_token', ssoId || '');
    
    window.location.href = `${window.location.origin}/home`;
    return;
  }

  // CASO B: Mi vecino me está pidiendo el token.
  if (requestSSO === 'true' && returnTo) {
    const miToken = localStorage.getItem('access_token');
    
    if (miToken) {
      const miRefresh = localStorage.getItem('refresh_token') || '';
      const miId = localStorage.getItem('id_token') || '';
      window.location.href = `${decodeURIComponent(returnTo)}/login?sso_token=${miToken}&sso_refresh=${miRefresh}&sso_id=${miId}`;
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

  checkSilentSSO() {
    // 1. Si ya tenemos token local en este puerto, vamos directo al Home, no molestamos al vecino
    if (localStorage.getItem('access_token')) {
      this.router.navigate(['/home']);
      return;
    }

    // 2. Si no lo tenemos, creamos el iframe oculto apuntando a la APP VECINA configurada
    const targetOrigin = environment.appVecinaUrl; 
    const iframe = document.createElement('iframe');
    iframe.src = targetOrigin;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // 3. Al cargar el iframe, le preguntamos si tiene sesión activa
    iframe.onload = () => {
      iframe.contentWindow?.postMessage('REQUEST_TOKEN', targetOrigin);
    };

    // 4. Escuchamos la respuesta del iframe
    const messageListener = async (event: MessageEvent) => {
      if (event.origin === targetOrigin && event.data?.type === 'SEND_TOKEN') {
        // ¡La otra app tiene sesión activa! Guardamos los tokens en nuestro puerto
        localStorage.setItem('access_token', event.data.access_token);
        localStorage.setItem('refresh_token', event.data.refresh_token);
        localStorage.setItem('id_token', event.data.id_token);

        // Limpieza de listeners e iframe
        window.removeEventListener('message', messageListener);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }

        // Redirigimos al Home inmediatamente de forma transparente
        this.router.navigate(['/home']);
      }
    };

    window.addEventListener('message', messageListener);

    // Timeout de seguridad: Si en 1.5 segundos la app vecina no responde (porque tampoco tiene sesión),
    // cancelamos la escucha y dejamos que el usuario vea tu login premium normal.
    setTimeout(() => {
      window.removeEventListener('message', messageListener);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
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
          // Guardar los tokens
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('id_token', response.id_token);
          
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
        // Guardamos los tokens en LocalStorage igual que en tu login manual
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('id_token', response.id_token);

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
}