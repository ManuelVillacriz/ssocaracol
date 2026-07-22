import { Injectable, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSession } from '../models/user-session';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../environments/environments';



@Injectable({
  providedIn: 'root'
})
export class SessionService {
  //private platformId = inject(PLATFORM_ID);
  private readonly SESSIONS_KEY = 'app_multi_sessions';
  private readonly ACTIVE_SESSION_ID_KEY = 'active_session_id';

  // Observable reactivo para notificar a componentes sobre cambios en la lista de cuentas
  private sessionsSubject = new BehaviorSubject<UserSession[]>([]);
  public sessions$: Observable<UserSession[]> = this.sessionsSubject.asObservable();

  //private router = inject(Router);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.sessionsSubject.next(this.getSessions());
    }
  }

  // 1. Obtiene todas las sesiones guardadas
  getSessions(): UserSession[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // 2. Guarda o actualiza una sesión en la lista
  saveSession(session: UserSession): void {
    console.log('saveSession')
    if (!isPlatformBrowser(this.platformId)) return;

    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id || s.username === session.username);

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    this.sessionsSubject.next(sessions);

    this.setActiveSession(session);
    
    // Tras remover el elemento del arreglo y actualizar el localStorage
    this.notificarYSobrescribirVecino();
  }

  // 3. Establece la cuenta activa actual y sincroniza las llaves locales
  setActiveSession(session: UserSession): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem(this.ACTIVE_SESSION_ID_KEY, session.id);
    localStorage.setItem('access_token', session.accessToken);
    localStorage.setItem('refresh_token', session.refreshToken);
    localStorage.setItem('id_token', session.idToken);
  }

  // 4. Obtiene la sesión activa actual
 getActiveSession(): UserSession | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const activeId = localStorage.getItem(this.ACTIVE_SESSION_ID_KEY);
    const sessions = this.getSessions();
    return sessions.find(s => s.id === activeId) || null;
  }
  // 5. Cierra la sesión de un usuario específico de la lista multicuenta
  /**
 * Elimina una sesión específica de la lista multicuenta.
 * Si la sesión eliminada era la ACTIVA, cambia automáticamente a la sesión previa.
 */
removeSession(userIdToRemove: string): 'SWITCHED' | 'EMPTY' | 'REMOVED_INACTIVE' {
  console.log('removeSession');
  if (!isPlatformBrowser(this.platformId)) return 'EMPTY';

  let sessions = this.getSessions();
  const index = sessions.findIndex(s => s.id === userIdToRemove);

  if (index === -1) return 'REMOVED_INACTIVE';

  const activeSession = this.getActiveSession();
  const isRemovingActive = activeSession?.id === userIdToRemove;

  // 1. Quitar la cuenta de la lista y actualizar localStorage local PRIMERO
  sessions.splice(index, 1);
  localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

  // 2. Si NO era la activa: actualizamos BehaviorSubject Y notificamos al vecino
  if (!isRemovingActive) {
    this.sessionsSubject.next(sessions);
    this.notificarYSobrescribirVecino(); // 👈 LÍNEA AÑADIDA
    return 'REMOVED_INACTIVE';
  }

  // 3. Si SÍ era la activa y quedan cuentas
  if (sessions.length > 0) {
    const newActiveIndex = Math.max(0, index - 1);
    const nextActiveSession = sessions[newActiveIndex];

    this.setActiveSession(nextActiveSession);
    this.sessionsSubject.next(sessions);
    this.notificarYSobrescribirVecino();
    return 'SWITCHED';
  } else {
    // No quedan más cuentas
    localStorage.removeItem(this.ACTIVE_SESSION_ID_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    this.sessionsSubject.next([]);
    this.notificarYSobrescribirVecino();
    return 'EMPTY';
  }
}


  // 6. Método para aplicar sincronizaciones recibidas desde la app vecina
  updateMultiSessionsFromNeighbor(sessions: UserSession[]): void {
    if (!isPlatformBrowser(this.platformId)) return;

    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    this.sessionsSubject.next(sessions);
  }

  /**
 * Cierra absolutamente todas las sesiones de la app y redirige al Login
 */
async logoutAll(): Promise<void> {
  if (!isPlatformBrowser(this.platformId)) return;

  try {
    // 1️⃣ PRIMERO: Vaciamos y eliminamos las sesiones en la app VECINA (:4300)
    // Le enviamos [] explícitamente y esperamos que la promesa resuelva
    await this.notificarYSobrescribirVecino([]);

    // 2️⃣ SEGUNDO: Eliminamos las sesiones locales de la app ACTUAL (:4200)
    localStorage.removeItem(this.SESSIONS_KEY);
    localStorage.removeItem(this.ACTIVE_SESSION_ID_KEY);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');

    // Notificamos a los suscriptores locales de RxJS
    this.sessionsSubject.next([]);

    // 3️⃣ TERCERO: Redirigimos al /login (con recarga limpia para destruir estados)
    window.location.href = window.location.origin + '/login';

  } catch (error) {
    console.error('Error durante logoutAll:', error);
    // Fallback de seguridad en caso de fallo
    localStorage.clear();
    window.location.href = window.location.origin + '/login';
  }
}

/**
 * Envía la lista de sesiones actualizada al dominio vecino vía Iframe silencioso
 */
public notificarCambioAVecino(): void {
  if (!isPlatformBrowser(this.platformId)) return;

  const targetOrigin = environment.appVecinaUrl;
  if (!targetOrigin) return;

  const sessions = this.getSessions(); // Obtiene el arreglo app_multi_sessions actual
  const activeId = localStorage.getItem('active_session_id');

  // Creamos un iframe temporal para empujar los datos al vecino
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `${targetOrigin}/sso-bridge`;

  iframe.onload = () => {
    iframe.contentWindow?.postMessage({
      type: 'PUSH_MULTI_SESSIONS',
      sessions: sessions,
      activeId: activeId
    }, targetOrigin);

    // Destruimos el iframe después de transmitir
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  document.body.appendChild(iframe);
}

// En tu SessionService (session.service.ts)

public sincronizarConVecino(): Promise<void> {
  return new Promise((resolve) => {
    if (!isPlatformBrowser(this.platformId)) {
      resolve();
      return;
    }

    if (window.location.pathname.includes('/login')) {
       resolve();
    return;
  }

    const targetOrigin = environment.appVecinaUrl;
    if (!targetOrigin) {
      resolve();
      return;
    }

    // 1. Creamos el iframe apuntando al puente del vecino
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${targetOrigin}/sso-bridge`;

    const cleanup = () => {
      window.removeEventListener('message', messageHandler);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    };

    const messageHandler = (event: MessageEvent) => {
      if (event.origin === targetOrigin && event.data?.type === 'SYNC_MULTI_SESSIONS') {
        const sesionesVecinas = event.data.sessions;
        
        if (Array.isArray(sesionesVecinas) && sesionesVecinas.length > 0) {
          // Unificamos las sesiones de ambos dominios sin duplicar por ID
          const sesionesLocales = JSON.parse(localStorage.getItem('app_multi_sessions') || '[]');
          
          const mapaSesiones = new Map<string, any>();
          // Insertamos primero las locales y luego las vecinas
          sesionesLocales.forEach((s: any) => mapaSesiones.set(s.id, s));
          sesionesVecinas.forEach((s: any) => mapaSesiones.set(s.id, s));

          const listaConsolidada = Array.from(mapaSesiones.values());

          // Guardamos la lista unificada en el localStorage local
          localStorage.setItem('app_multi_sessions', JSON.stringify(listaConsolidada));

          // Notificamos a la UI (BehaviorSubject o propiedad local)
          this.sessionsSubject.next(listaConsolidada); 
        }

        cleanup();
      }
    };

    window.addEventListener('message', messageHandler);

    iframe.onload = () => {
      // Al cargar el iframe, le pedimos sus sesiones
      iframe.contentWindow?.postMessage('GET_MULTI_SESSIONS', targetOrigin);
    };

    // Timeout de seguridad de 1 segundo si el vecino no responde
    setTimeout(() => {
      cleanup();
    }, 1000);

    document.body.appendChild(iframe);
  });
}

// En session.service.ts (Aplica exactamente igual para 4200 y 4300)

public notificarYSobrescribirVecino(sessionsOverride?: any[]): Promise<void> {
  return new Promise((resolve) => {
    if (!isPlatformBrowser(this.platformId) || window.self !== window.top) {
      resolve();
      return;
    }

    const targetOrigin = environment.appVecinaUrl; // http://localhost:4300
    if (!targetOrigin) {
      resolve();
      return;
    }

    // Permite pasar un arreglo explícito (ej. []) o leer el del localStorage
    const sessions = sessionsOverride ?? JSON.parse(localStorage.getItem(this.SESSIONS_KEY) || '[]');
    const activeId = sessionsOverride ? null : localStorage.getItem(this.ACTIVE_SESSION_ID_KEY);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${targetOrigin}/sso-bridge`;

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.postMessage({
          type: 'PUSH_OVERWRITE_SESSIONS',
          sessions: sessions,
          activeId: activeId
        }, targetOrigin);

        // Esperamos 200ms extra para que el bridge del vecino reciba y procese en su localStorage
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          resolve(); // 🟢 Notificación al vecino completada con éxito
        }, 200);
      }, 100);
    };

    // Si ocurre un error al cargar el iframe del vecino, no bloqueamos la app local
    iframe.onerror = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve();
    };

    document.body.appendChild(iframe);
  });
}

// public notificarYSobrescribirVecino(): void {
//   // 1. Evitamos bucles si estamos dentro de un iframe
//   if (!isPlatformBrowser(this.platformId) || window.self !== window.top) {
//     return;
//   }

//   const targetOrigin = environment.appVecinaUrl; // http://localhost:4300
//   if (!targetOrigin) return;

//   const sessions = JSON.parse(localStorage.getItem('app_multi_sessions') || '[]');
//   const activeId = localStorage.getItem('active_session_id');

//   const iframe = document.createElement('iframe');
//   iframe.style.display = 'none';
//   iframe.src = `${targetOrigin}/sso-bridge`;

//   iframe.onload = () => {
//     // ⏳ Le damos 200ms a Angular dentro del iframe para que ejecute ngOnInit() y active el listener
//     setTimeout(() => {
//       iframe.contentWindow?.postMessage({
//         type: 'PUSH_OVERWRITE_SESSIONS',
//         sessions: sessions,
//         activeId: activeId
//       }, targetOrigin);

//       // Limpiamos el iframe tras la entrega
//       setTimeout(() => {
//         if (document.body.contains(iframe)) {
//           document.body.removeChild(iframe);
//         }
//       }, 300);
//     }, 200);
//   };

//   document.body.appendChild(iframe);
// }


}