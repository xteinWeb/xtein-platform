import { Tab } from "src/app/containers/tabs/tab.model";
import { ADM015Component } from "src/app/modulos/ADM015/ADM015.component";
import { TableroComponent } from '../../containers/tablero/tablero.component';
import { DBCOM001Component } from "src/app/modulos/MEN/COM/DBCOM001/DBCOM001.component";
import { MEN1000Component } from "src/app/modulos/MEN1000/MEN1000.component";
import { INV209Component } from "src/app/modulos/INV209/INV209.component";
import { INV210Component } from "src/app/modulos/INV210/INV210.component";
import { HISTORIALNTFComponent } from "src/app/shared/notificaciones/historial/historial-ntf.component";
import { MatrizAvanzadaComponent } from "../matriz-avanzada/matriz-avanzada.component";
import { ADM201Component } from "src/app/modulos/ADM201/ADM201.component";
import { MAD001Component } from "src/app/modulos/MAD001/MAD001.component";
import { MAD002Component } from "src/app/modulos/MAD002/MAD002.component";
import { MAD005Component } from "src/app/modulos/MAD005/MAD005.component";
import {DashboardPageComponent} from "src/app/shared/components/dashboard-page/dashboard-page.component"

export const tabs: Tab[] = [
  new Tab(ADM015Component, "Usuarios", { parent: "PrincipalComponent" }, 'ADM-015', 'icon usuarios-sl-rd', '', false),  
  new Tab(TableroComponent, "Tablero", { parent: "PrincipalComponent" }, 'ADM-300', 'icon inicio-apps', '', false),  
  new Tab(DBCOM001Component, "Dashboard compras", { parent: "PrincipalComponent" }, 'MEN-000', 'icon tarea-sl', '', false),
  new Tab(MEN1000Component, "Busqueda Multifuncional", { parent: "PrincipalComponent" }, 'MEN-1000', 'icon tarea-sl', '', false),
  new Tab(INV209Component, "Kardex de productos", { parent: "PrincipalComponent" }, 'INV-209', 'icon pedido-sl', '', false),
  new Tab(INV210Component, "Inventario Fisico", { parent: "PrincipalComponent" }, 'INV-210', 'icon pedido-sl', '', false),
  new Tab(MatrizAvanzadaComponent, "Matriz Avanzada", { parent: "PrincipalComponent" }, 'MA-019', 'icon web-ol', '', false),
  new Tab(HISTORIALNTFComponent, "Notificaciones", { parent: "PrincipalComponent" }, 'ADM-1000', 'icon-bell-ol', '', false),
  new Tab(ADM201Component, "Aplicaciones", { parent: "PrincipalComponent" }, 'ADM-201', 'dx-icon-activefolder', '', false),
  new Tab(MAD001Component, "Mentor Maestro", { parent: "PrincipalComponent" }, 'MAD-001', 'dx-icon-activefolder', '', false),    
  new Tab(MAD002Component, "Diseñador Dashboards y KPIs", { parent: "PrincipalComponent" }, 'MAD-002', 'dx-icon-activefolder', '', false),    
  new Tab(MAD005Component, "Orígenes de Datos", { parent: "PrincipalComponent" }, 'MAD-005', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Ventas por canales", { parent: "PrincipalComponent" }, 'MCOM-001', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Clientes nuevos", { parent: "PrincipalComponent" }, 'MCOM-002', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "EBIDTA", { parent: "PrincipalComponent" }, 'MFIN-001', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "EBIDTA vs Ventas", { parent: "PrincipalComponent" }, 'MFIN-002', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Indicadores Comercial", { parent: "PrincipalComponent" }, 'MCOM-000', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Indicadores Financiero", { parent: "PrincipalComponent" }, 'MFIN-000', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Variación Costos", { parent: "PrincipalComponent" }, 'MCPR-012', 'dx-icon-activefolder', '', false),    
  new Tab(DashboardPageComponent, "Históricos Inventario", { parent: "PrincipalComponent" }, 'MALM-007', 'dx-icon-activefolder', '', false),   
  new Tab(DashboardPageComponent, "Ventas Productos Partes", { parent: "PrincipalComponent" }, 'MCOM-019', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Pareto Ventas", { parent: "PrincipalComponent" }, 'MCOM-020', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Productos Nuevos", { parent: "PrincipalComponent" }, 'MCOM-021', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Ventas por Categorías", { parent: "PrincipalComponent" }, 'MCOM-022', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Ventas", { parent: "PrincipalComponent" }, 'MCOM-023', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Margen de Contribucion", { parent: "PrincipalComponent" }, 'MCOM-024', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Top Productos Categorias", { parent: "PrincipalComponent" }, 'MCOM-025', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Ventas Mensuales", { parent: "PrincipalComponent" }, 'MCOM-026', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Ventas 2026", { parent: "PrincipalComponent" }, 'MCOM-027', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Empleados Secciones", { parent: "PrincipalComponent" }, 'MTHU-010', 'dx-icon-activefolder', '', false),
  new Tab(DashboardPageComponent, "Ausentismo", { parent: "PrincipalComponent" }, 'MTHU-011', 'dx-icon-activefolder', '', false),
];
