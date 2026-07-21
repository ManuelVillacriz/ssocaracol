import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { AppRoutingModule } from '../app-routing.module';
import { SidenavComponent } from './sidenav/sidenav.component';
import { MonedaInputDirective } from './moneda-input.directive';



@NgModule({
  declarations: [
    SidenavComponent,
    MonedaInputDirective
  ],
  exports: [
    SidenavComponent,
    MonedaInputDirective
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    MaterialModule
  ]
})
export class SharedModule { }
