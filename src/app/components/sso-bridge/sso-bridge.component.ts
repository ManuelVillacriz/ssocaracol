import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environments';


@Component({
  selector: 'app-sso-bridge',
  template: ''
})
export class SsoBridgeComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    //console.log('🔥 2. SsoBridgeComponent INIT EJECUTADO');

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('message', (event) => {
        //console.log('🔥 3. Mensaje recibido en el bridge:', event.origin, event.data);

        // Validamos el origen exacto
        if (event.origin === environment.appVecinaUrl) {
          if (event.data?.type === 'PUSH_OVERWRITE_SESSIONS') {
            const { sessions, activeId } = event.data;

            if (Array.isArray(sessions)) {
              // 1. Si hay sesiones, guardamos. Si el arreglo viene vacío ([]), eliminamos la clave.
              if (sessions.length > 0) {
                localStorage.setItem('app_multi_sessions', JSON.stringify(sessions));
              } else {
                localStorage.removeItem('app_multi_sessions');
              }

              // 2. Gestionamos el id de la sesión activa
              if (activeId) {
                localStorage.setItem('active_session_id', activeId);
              } else {
                localStorage.removeItem('active_session_id');
              }

              // 3. Si la lista viene vacía, también purgamos los tokens locales del vecino
              if (sessions.length === 0) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('id_token');
              }

              console.log('✅ SESIONES PROCESADAS CON ÉXITO EN EL BRIDGE');
            }
          }
        } else {
          console.warn('Origen no coincide:', event.origin, 'esperado:', environment.appVecinaUrl);
        }
      });
    }
  }
}