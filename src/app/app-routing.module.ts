import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClienteComponent } from './components/cliente/cliente.component';
import { ClienteFormComponent } from './components/cliente/cliente-form.component';
import { CuentaComponent } from './components/cuenta/cuenta.component';
import { CuentaFormComponent } from './components/cuenta/cuenta-form.component';
import { MovimientoComponent } from './components/movimiento/movimiento.component';
import { MovimientoFormComponent } from './components/movimiento/movimiento-form.component';
import { ReporteComponent } from './components/movimiento/reporte.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SsoBridgeComponent } from './components/sso-bridge/sso-bridge.component';


const routes: Routes = [
  
  { path: 'sso-bridge', component: SsoBridgeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  //{ path: '', redirectTo: '/login', pathMatch: 'full' },
  //{ path: '**', redirectTo: '/login' },

  {path:'cliente', component: ClienteComponent},
  {path:'cliente/form', component: ClienteFormComponent},
  {path:'cliente/form/:id', component: ClienteFormComponent},
  {path:'cuenta', component: CuentaComponent},
  {path:'cuenta/form', component: CuentaFormComponent},
  {path:'cuenta/form/:id', component: CuentaFormComponent},
  {path:'movimiento', component: MovimientoComponent},
  {path:'movimiento/form', component: MovimientoFormComponent},
  {path:'movimiento/form/:id', component: MovimientoFormComponent},
  {path:'reporte', component: ReporteComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
