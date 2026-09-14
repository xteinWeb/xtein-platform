import { Component, ViewChild } from '@angular/core';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { CommonModule, DatePipe } from '@angular/common';
import { TabService } from 'src/app/containers/tabs/tab.service';
import Swal from 'sweetalert2';
import { COM200Service } from 'src/app/services/COM200/COM200.service';
import { libtools } from 'src/app/shared/common/libtools';
import { MatTabsModule } from '@angular/material/tabs';
import { COM20203Component } from './COM20203/COM20203.component';
import { COM20202Component } from './COM20202/COM20202.component';
import { Subject } from 'rxjs';
import { DxTabsModule } from 'devextreme-angular';

@Component({
  selector: 'app-COM202',
  templateUrl: './COM202.component.html',
  styleUrls: ['./COM202.component.css'],
  standalone: true,
  imports: [ CommonModule, COM20202Component, COM20203Component,
             DxTabsModule
           ]
})
export class COM202Component {

  ltool: any;
  TooltipTarget: any;
  ToolTipText: string;
  selectedTab: number;
  tabVisible: any[] = ["block","none"];

  eventsSubjectAcciones: Subject<any> = new Subject<any>();
  
  constructor(
    private _sdatos: COM200Service,
    private SVisor: SvisorService,
    private _sbarreg: SbarraService,
    private _sfiltro: SfiltroService,
    private _sgenerales: GeneralesService,
    private datepipe: DatePipe,
    private tabService: TabService
  ) 
  {
    this.ltool = new libtools(this._sbarreg, this.tabService);
     
  }

  onSeleccOC(e) {
    this.selectedTab = 1;
    this.tabVisible[0] = "none";
    this.tabVisible[1] = "block";
    this.eventsSubjectAcciones.next(e);
  }

  onTabChanged(e:any){
    switch (e.itemIndex) {
      case 0:
        this.tabVisible[0] = "block";
        this.tabVisible[1] = "none";
        break;
        
      case 1:
        this.tabVisible[0] = "none";
        this.tabVisible[1] = "block";
        break;
        
      default:
        break;
    }
  }

  ngOnInit(): void {
    
  }

  ngAfterViewInit(): void { 
    setTimeout(() => {
    }, 300);

  }


  ngOnDestroy(){
  }

  showModal(mensaje:any, titulo = '¡Error!', msg_html= '') {
    Swal.fire({
			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: "center",
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

}
