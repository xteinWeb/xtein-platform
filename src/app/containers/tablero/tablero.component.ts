import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';

import * as drag from '../../../assets/js/drag.js';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { TabService } from '../tabs/tab.service';
import { tabs } from '../../shared/classes/tabs.class';
import { GlobalVariables } from '../../shared/common/global-variables';
import { Tab } from '../tabs/tab.model';
import { COMO1Service } from 'src/app/services/COM01/s_COM01.service';
import { VEN220Service } from 'src/app/services/VEN220/s_VEN220.service';
import { clsBarraRegistro } from '../regbarra/_clsBarraReg';
import { Subscription } from 'rxjs';
import { SbarraService } from '../regbarra/_sbarra.service';
import Swal from 'sweetalert2';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DxBarGaugeModule, DxButtonModule, DxListModule, DxLoadPanelModule, DxPopupModule, DxHtmlEditorModule, DxCheckBoxModule, DxSelectBoxModule, DxChartModule, DxPieChartModule, DxSchedulerModule, DxSchedulerComponent} from 'devextreme-angular';
import { registerPalette, getPalette } from 'devextreme/viz/palette';


@Component({
    selector: 'app-tablero',
    templateUrl: './tablero.component.html',
    styleUrls: ['./tablero.component.css',
        './stylesdrag.css',
        './bootstrap.min.css',
        './material-icons.css',
        '../../../assets/xtein.scss'
    ],
    imports: [CommonModule, DxLoadPanelModule, DxPopupModule, DxListModule, DxButtonModule, DxChartModule, DxHtmlEditorModule,
        DxCheckBoxModule, DxSelectBoxModule, DxPopupModule, DxBarGaugeModule, DxPieChartModule, DxSchedulerModule]
})
export class TableroComponent implements OnInit {
  @HostBinding('class.projects-table') public readonly projectsTable = true;
  @ViewChild('schedulerAgenda', { static: false }) schedulerAgenda: DxSchedulerComponent;
  

  myCustomPalette1: string[];
  myCustomPalette2: string[];
  
  customizeLabel(e) {
    return `${e.argumentText}\n${e.valueText}`;
  }

  populationData: any [];
  pipe: any = new DecimalPipe('en-es');
  

  // Datos mas usadas
  tblMasUsadas: any;
  DCompras: any;
  tblFavoritas: any;
  tblAplUsr: any;
  loadingVisible: boolean = false;
  visible: boolean = false;
  visibleListaFav: boolean = false;
  seleccAplFavUsr: any[] = [];
  prmUsrAplBarReg: clsBarraRegistro;
  subscription: Subscription;
  isPopupVisible: boolean = false;

  // Agenda
  appointmentsData: any [];

  assignees: any [] = [
    {
      text: 'Samantha Bright',
      id: 1,
      color: 'rgba(46,173,229,1)',
    }, {
      text: 'John Heart',
      id: 2,
      color: 'rgba(98,121,140,.75)',
    }, {
      text: 'Todd Hoffman',
      id: 3,
      color: 'rgba(26,115,232,1)',
    }, {
      text: 'Sandra Johnson',
      id: 4,
      color: 'rgba(53,204,172,1)',
    },
  ];

  priorities: any [] = [
    {
      text: 'High',
      id: 1,
      color: 'rgba(223,62,62,1)',
    }, {
      text: 'Low',
      id: 2,
      color: 'rgba(237,104,69,1)',
    },
  ];

  currentDate: Date;


  // Pie chart
  populationByRegions: any = [{
    region: 'Asia',
    val: 4119626293,
  }, {
    region: 'Africa',
    val: 1012956064,
  }, {
    region: 'Northern America',
    val: 344124520,
  }, {
    region: 'Latin America',
    val: 590946440,
  }, {
    region: 'Europe',
    val: 727082222,
  }, {
    region: 'Oceania',
    val: 35104756,
  }];

  dataSource: any [] = [{
    day: 'Monday',
    oranges: 3,
  }, {
    day: 'Tuesday',
    oranges: 2,
  }, {
    day: 'Wednesday',
    oranges: 3,
  }, {
    day: 'Thursday',
    oranges: 4,
  }, {
    day: 'Friday',
    oranges: 6,
  }, {
    day: 'Saturday',
    oranges: 11,
  }, {
    day: 'Sunday',
    oranges: 4,
  }];

  isMultiline = true;

  valueContent: string;

  tabs: any [] = [
    { name: 'From This Device', value: ['file'] },
    { name: 'From the Web', value: ['url'] },
    { name: 'Both', value: ['file', 'url'] },
  ];

  currentTab: string[];

  // Datos de gráficas
  public mainChartElements = 12;
  public mainChartData1: Array<number> = [];
  public mainChartData2: Array<number> = [];
  public mainChartData3: Array<number> = [];

  constructor(
    private _sdatos: GeneralesService,
    private tabService: TabService,
    private s_COM01: COMO1Service,
    private s_VEN220: VEN220Service,
    private _sbarreg: SbarraService
    ) 
  {
    // Servicio de barra de registro
    this.subscription = this._sbarreg
    .getObsRegApl()
    .subscribe((datreg) => {
      // Valida si la petición es para esta aplicacion
      if (datreg.aplicacion === this.prmUsrAplBarReg.aplicacion)
        this.opMenuRegistro(datreg);
    });

    //paleta de color para bargauche, chart, piechart
    registerPalette("xt-blue-palette", {
      simpleSet: ['#2959A4', '#337AB7', '#7296C0', '#99BADD', '#CCE7FF', '#69C1D5', '#35CCAC', '#299D9E', '#008377', '#FDC97C', '#6D51FE', '#589BFF'], 
      indicatingSet: ['#2959A4', '#337AB7', '#7296C0', '#99BADD', '#CCE7FF', '#69C1D5', '#35CCAC', '#299D9E', '#008377', '#FDC97C', '#6D51FE', '#589BFF'], 
      gradientSet: ['#2959A4', '#337AB7', '#7296C0', '#99BADD', '#CCE7FF', '#69C1D5', '#35CCAC', '#299D9E', '#008377', '#FDC97C', '#6D51FE', '#589BFF'] 
    });

    registerPalette("xt-green-palette", {
      simpleSet: ['#35CCAC', '#299D9E', '#008377', '#FDC97C', '#69C1D5'], 
      indicatingSet: ['#35CCAC', '#299D9E', '#008377', '#FDC97C', '#69C1D5'], 
      gradientSet: ['#35CCAC', '#299D9E', '#008377', '#FDC97C', '#69C1D5'] 
    });
    
    // Obtiene la paleta personalizada
    this.myCustomPalette1 = getPalette("xt-blue-palette");
    this.myCustomPalette2 = getPalette("xt-green-palette");
    
    // Custom Annotations del dx-chart

    this.populationData  = [{
      name: 'Ene',
      population: 2274,
      capital: 'Sacramento',
      area: 423967,
    }, {
      name: 'Mar',
      population: 1688,
      capital: 'Austin',
      area: 695662,
    }, {
      name: 'May',
      population: 2895,
      capital: 'Tallahassee',
      area: 170312,
    }, {
      name: 'Jul',
      population: 2489,
      capital: 'Albany',
      area: 141297,
    }, {
      name: 'Sept',
      population: 3880,
      capital: 'Springfield',
      area: 149995,
    }];
    
  }

  togglePopup(): void {
    this.isPopupVisible = !this.isPopupVisible;
  }

  // Llama a Acciones de registro
  opMenuRegistro(operMenu: clsBarraRegistro): void {

    switch (operMenu.accion) {
      case "r_ini":
        const user:any = localStorage.getItem("usuario");
        this.prmUsrAplBarReg = {
          tabla: "Tablero",
          aplicacion: "ADM-300",
          usuario: user,
          accion: "r_ini",
          error: "",
          r_numReg: 0,
          r_totReg: 0,
          operacion: {}
        };
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        break;

      default:
        break;
    }
  }

  public mainChartData: Array<any> = [
    {
      data: this.mainChartData1,
      label: 'Current'
    },
    {
      data: this.mainChartData2,
      label: 'Previous'
    },
    {
      data: this.mainChartData3,
      label: 'BEP'
    }
  ];

  /* tslint:disable:max-line-length */
  public mainChartLabels: Array<any> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Thursday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  /* tslint:enable:max-line-length */
  public mainChartOptions: any = {
    tooltips: {
      enabled: false,
      custom: '',
      intersect: true,
      mode: 'index',
      position: 'nearest',
      callbacks: {
        labelColor: function(tooltipItem:any, chart:any) {
          return { backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor };
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        gridLines: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.charAt(0);
          }
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true,
          maxTicksLimit: 5,
          stepSize: Math.ceil(100000000 / 5),
          max: 100000000
        }
      }]
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 0,
        hitRadius: 10,
        hoverRadius: 4,
        hoverBorderWidth: 3,
      }
    },
    legend: {
      display: false
    }
  };
  public mainChartColours: Array<any> = [
    { // brandInfo
      // backgroundColor: hexToRgba(getStyle('--info'), 10),
      // borderColor: getStyle('--info'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandSuccess
      // backgroundColor: 'transparent',
      // borderColor: getStyle('--success'),
      pointHoverBackgroundColor: '#fff'
    },
    { // brandDanger
      backgroundColor: 'transparent',
      // borderColor: getStyle('--danger'),
      pointHoverBackgroundColor: '#fff',
      borderWidth: 1,
      borderDash: [8, 5]
    }
  ];
  public mainChartLegend = true;
  public mainChartType = 'line';

  public random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // chedulerContentReady
  onSchedulerContentReady(e: any) {
    if(this.appointmentsData.length <= 0) {
      this.appointmentsData = [
        {
          text: 'Google AdWords Strategy',
          startDate: new Date('2021-05-03T16:00:00.000Z'),
          endDate: new Date('2021-05-03T17:30:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'New Brochures',
          startDate: new Date('2021-05-03T18:30:00.000Z'),
          endDate: new Date('2021-05-03T21:15:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Brochure Design Review',
          startDate: new Date('2021-05-03T20:15:00.000Z'),
          endDate: new Date('2021-05-03T23:15:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Website Re-Design Plan',
          startDate: new Date('2021-05-03T23:45:00.000Z'),
          endDate: new Date('2021-05-04T18:15:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Rollout of New Website and Marketing Brochures',
          startDate: new Date('2021-05-04T15:15:00.000Z'),
          endDate: new Date('2021-05-04T17:45:00.000Z'),
          assigneeId: 4,
          priorityId: 2,
        }, {
          text: 'Update Sales Strategy Documents',
          startDate: new Date('2021-05-04T19:00:00.000Z'),
          endDate: new Date('2021-05-04T20:45:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Non-Compete Agreements',
          startDate: new Date('2021-05-05T15:15:00.000Z'),
          endDate: new Date('2021-05-05T16:00:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Approve Hiring of John Jeffers',
          startDate: new Date('2021-05-05T17:00:00.000Z'),
          endDate: new Date('2021-05-05T18:15:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Update NDA Agreement',
          startDate: new Date('2021-05-05T18:45:00.000Z'),
          endDate: new Date('2021-05-05T20:45:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Update Employee Files with New NDA',
          startDate: new Date('2021-05-05T21:00:00.000Z'),
          endDate: new Date('2021-05-05T23:45:00.000Z'),
          assigneeId: 4,
          priorityId: 1,
        }, {
          text: 'Submit Questions Regarding New NDA',
          startDate: new Date('2021-05-07T01:00:00.000Z'),
          endDate: new Date('2021-05-06T16:30:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Submit Signed NDA',
          startDate: new Date('2021-05-06T19:45:00.000Z'),
          endDate: new Date('2021-05-06T21:00:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Review Revenue Projections',
          startDate: new Date('2021-05-07T00:15:00.000Z'),
          endDate: new Date('2021-05-06T15:00:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Comment on Revenue Projections',
          startDate: new Date('2021-05-07T16:15:00.000Z'),
          endDate: new Date('2021-05-07T18:15:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Provide New Health Insurance Docs',
          startDate: new Date('2021-05-07T19:45:00.000Z'),
          endDate: new Date('2021-05-07T21:15:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Review Changes to Health Insurance Coverage',
          startDate: new Date('2021-05-07T21:15:00.000Z'),
          endDate: new Date('2021-05-07T22:30:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Review Training Course for any Omissions',
          startDate: new Date('2021-05-10T21:00:00.000Z'),
          endDate: new Date('2021-05-11T19:00:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Recall Rebate Form',
          startDate: new Date('2021-05-10T19:45:00.000Z'),
          endDate: new Date('2021-05-10T20:15:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Create Report on Customer Feedback',
          startDate: new Date('2021-05-11T22:15:00.000Z'),
          endDate: new Date('2021-05-12T00:30:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Review Customer Feedback Report',
          startDate: new Date('2021-05-11T23:15:00.000Z'),
          endDate: new Date('2021-05-12T01:30:00.000Z'),
          assigneeId: 2,
          priorityId: 1,
        }, {
          text: 'Customer Feedback Report Analysis',
          startDate: new Date('2021-05-12T16:30:00.000Z'),
          endDate: new Date('2021-05-12T17:30:00.000Z'),
          recurrenceRule: 'FREQ=WEEKLY',
          assigneeId: 4,
          priorityId: 2,
        }, {
          text: 'Prepare Shipping Cost Analysis Report',
          startDate: new Date('2021-05-12T19:30:00.000Z'),
          endDate: new Date('2021-05-12T20:30:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Provide Feedback on Shippers',
          startDate: new Date('2021-05-12T21:15:00.000Z'),
          endDate: new Date('2021-05-12T23:00:00.000Z'),
          assigneeId: 4,
          priorityId: 2,
        }, {
          text: 'Select Preferred Shipper',
          startDate: new Date('2021-05-13T00:30:00.000Z'),
          endDate: new Date('2021-05-13T03:00:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Complete Shipper Selection Form',
          startDate: new Date('2021-05-13T15:30:00.000Z'),
          endDate: new Date('2021-05-13T17:00:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Upgrade Server Hardware',
          startDate: new Date('2021-05-13T19:00:00.000Z'),
          endDate: new Date('2021-05-13T21:15:00.000Z'),
          recurrenceRule: 'FREQ=WEEKLY',
          assigneeId: 2,
          priorityId: 1,
        }, {
          text: 'Upgrade Personal Computers',
          startDate: new Date('2021-05-13T21:45:00.000Z'),
          endDate: new Date('2021-05-13T23:30:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Upgrade Apps to Windows RT or stay with WinForms',
          startDate: new Date('2021-05-14T17:30:00.000Z'),
          endDate: new Date('2021-05-14T20:00:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Estimate Time Required to Touch-Enable Apps',
          startDate: new Date('2021-05-14T21:45:00.000Z'),
          endDate: new Date('2021-05-14T23:30:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Report on Tranistion to Touch-Based Apps',
          startDate: new Date('2021-05-15T01:30:00.000Z'),
          endDate: new Date('2021-05-15T02:00:00.000Z'),
          assigneeId: 4,
          priorityId: 1,
        }, {
          text: 'Submit New Website Design',
          startDate: new Date('2021-05-17T15:00:00.000Z'),
          endDate: new Date('2021-05-17T17:00:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Create Icons for Website',
          startDate: new Date('2021-05-17T18:30:00.000Z'),
          endDate: new Date('2021-05-17T20:15:00.000Z'),
          assigneeId: 4,
          priorityId: 2,
        }, {
          text: 'Create New Product Pages',
          startDate: new Date('2021-05-18T16:45:00.000Z'),
          endDate: new Date('2021-05-18T18:45:00.000Z'),
          assigneeId: 2,
          priorityId: 1,
        }, {
          text: 'Approve Website Launch',
          startDate: new Date('2021-05-18T19:00:00.000Z'),
          endDate: new Date('2021-05-18T22:15:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Update Customer Shipping Profiles',
          startDate: new Date('2021-05-19T16:30:00.000Z'),
          endDate: new Date('2021-05-19T18:00:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Create New Shipping Return Labels',
          startDate: new Date('2021-05-19T19:45:00.000Z'),
          endDate: new Date('2021-05-19T21:00:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Get Design for Shipping Return Labels',
          startDate: new Date('2021-05-19T22:00:00.000Z'),
          endDate: new Date('2021-05-19T23:30:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'PSD needed for Shipping Return Labels',
          startDate: new Date('2021-05-20T15:30:00.000Z'),
          endDate: new Date('2021-05-20T16:15:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Contact ISP and Discuss Payment Options',
          startDate: new Date('2021-05-20T18:30:00.000Z'),
          endDate: new Date('2021-05-20T23:00:00.000Z'),
          assigneeId: 4,
          priorityId: 1,
        }, {
          text: 'Prepare Year-End Support Summary Report',
          startDate: new Date('2021-05-21T00:00:00.000Z'),
          endDate: new Date('2021-05-21T03:00:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Review New Training Material',
          startDate: new Date('2021-05-21T15:00:00.000Z'),
          endDate: new Date('2021-05-21T16:15:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Distribute Training Material to Support Staff',
          startDate: new Date('2021-05-21T19:45:00.000Z'),
          endDate: new Date('2021-05-21T21:00:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Training Material Distribution Schedule',
          startDate: new Date('2021-05-21T21:15:00.000Z'),
          endDate: new Date('2021-05-21T23:15:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Approval on Converting to New HDMI Specification',
          startDate: new Date('2021-05-24T16:30:00.000Z'),
          endDate: new Date('2021-05-24T17:15:00.000Z'),
          assigneeId: 4,
          priorityId: 2,
        }, {
          text: 'Create New Spike for Automation Server',
          startDate: new Date('2021-05-24T17:00:00.000Z'),
          endDate: new Date('2021-05-24T19:30:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Code Review - New Automation Server',
          startDate: new Date('2021-05-24T20:00:00.000Z'),
          endDate: new Date('2021-05-24T22:00:00.000Z'),
          assigneeId: 3,
          priorityId: 1,
        }, {
          text: 'Confirm Availability for Sales Meeting',
          startDate: new Date('2021-05-25T17:15:00.000Z'),
          endDate: new Date('2021-05-25T22:15:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Reschedule Sales Team Meeting',
          startDate: new Date('2021-05-25T23:15:00.000Z'),
          endDate: new Date('2021-05-26T01:00:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        }, {
          text: 'Send 2 Remotes for Giveaways',
          startDate: new Date('2021-05-26T16:30:00.000Z'),
          endDate: new Date('2021-05-26T18:45:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Discuss Product Giveaways with Management',
          startDate: new Date('2021-05-26T19:15:00.000Z'),
          endDate: new Date('2021-05-26T23:45:00.000Z'),
          assigneeId: 4,
          priorityId: 1,
        }, {
          text: 'Replace Desktops on the 3rd Floor',
          startDate: new Date('2021-05-27T16:30:00.000Z'),
          endDate: new Date('2021-05-27T17:45:00.000Z'),
          assigneeId: 2,
          priorityId: 1,
        }, {
          text: 'Update Database with New Leads',
          startDate: new Date('2021-05-27T19:00:00.000Z'),
          endDate: new Date('2021-05-27T21:15:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Mail New Leads for Follow Up',
          startDate: new Date('2021-05-27T21:45:00.000Z'),
          endDate: new Date('2021-05-27T22:30:00.000Z'),
          assigneeId: 1,
          priorityId: 2,
        }, {
          text: 'Send Territory Sales Breakdown',
          startDate: new Date('2021-05-28T01:00:00.000Z'),
          endDate: new Date('2021-05-28T03:00:00.000Z'),
          assigneeId: 2,
          priorityId: 2,
        }, {
          text: 'Territory Sales Breakdown Report',
          startDate: new Date('2021-05-28T15:45:00.000Z'),
          endDate: new Date('2021-05-28T16:45:00.000Z'),
          assigneeId: 3,
          priorityId: 2,
        }, {
          text: 'Report on the State of Engineering Dept',
          startDate: new Date('2021-05-28T21:45:00.000Z'),
          endDate: new Date('2021-05-28T22:30:00.000Z'),
          assigneeId: 4,
          priorityId: 1,
        }, {
          text: 'Staff Productivity Report',
          startDate: new Date('2021-05-28T23:15:00.000Z'),
          endDate: new Date('2021-05-29T02:30:00.000Z'),
          assigneeId: 1,
          priorityId: 1,
        },
      ];
    }
    // Aquí puedes realizar acciones una vez que el Scheduler ha terminado de renderizarse
    
  }

  // Cargue de datos de widgets
  cargarDatos() {
    // Widget más usadas
    const prm = { usuario: localStorage.getItem('usuario') };
    this._sdatos.consulta('apl mas usadas',prm, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      this.tblMasUsadas = res;
    });

    // Widget favoritas
    const prmf = { usuario: localStorage.getItem('usuario') };
    this._sdatos.consulta('apl favoritas',prmf, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje === '')
        this.tblFavoritas = res;
      else
        this.tblFavoritas = [];
    });

    // Lista aplicaciones del usuario
    const prmau = { USUARIO: localStorage.getItem('usuario'), opcion: 'usuario' };
    this._sdatos.consulta('consulta aplicacion',prmau, 'generales').subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje === '')
        this.tblAplUsr = res; //res.map(({ icon, NOMBRE, ID_APLICACION}) => ({ icon, NOMBRE, ID_APLICACION}));
      else
        this.tblAplUsr = [];

      // Asocia las favoritas
      if (this.tblAplUsr.length !== 0) {
        if (this.tblFavoritas) {
          for (var k=0; k < this.tblFavoritas.length; k++) {
            const nx =  this.tblAplUsr.findIndex((a:any) => a.ID_APLICACION === this.tblFavoritas[k].ID_APLICACION);
            if (nx !== -1)
              this.seleccAplFavUsr.push(this.tblFavoritas[k].ID_APLICACION);
          }
        }
      }
    });

    // Widget top ventas
    const prmv = { ANO: 2021 };
    this.s_VEN220.informes('top ventas', prmv).subscribe((data: any)=> {
      const res = JSON.parse(data.data);
      if ( (data.token != undefined) ){
        const refreshToken = data.token;
        localStorage.setItem("token", refreshToken);
      }
      if (res[0].ErrMensaje === '') {
        // Extrae datos de cada caso
        const gelem = res.map(({NMES}:any) => ({NMES})).map((m:any) => m.NMES);
        const gventas = res.map(({NMES,PRODUCTO,VENTAS}:any) => ({NMES,PRODUCTO,VENTAS}));
        const gxaxis = gelem.reduce((unique:any,item:any) => unique.includes(item) ? unique : [...unique,item], []);
        this.mainChartLabels = gxaxis;

        // top de productos
        const vpro = gventas.map((p:any) => p.PRODUCTO);
        const gprod = vpro.reduce((unique:any,item:any) => unique.includes(item) ? unique : [...unique,item], []);
        this.mainChartData[0].label = gprod[0];
        this.mainChartData[1].label = gprod[1];
        this.mainChartData[2].label = gprod[2];

        // generate random values for mainChart
        for (let i = 0; i < gxaxis.length; i++) {
          for (let k = 0; k < gprod.length; k++) {
            const dat = gventas.find((v:any) => v.NMES===gxaxis[i] && v.PRODUCTO===gprod[k]);
            if (dat && k===0) this.mainChartData1.push(dat.VENTAS);
            if (dat && k===1) this.mainChartData2.push(dat.VENTAS);
            if (dat && k===2) this.mainChartData3.push(dat.VENTAS);
          }
        }
      }
      else
        this.tblFavoritas = [];
    });

    // Widget compras
    this.genTopCompras();

  }

  ngOnInit(): void {
    this.cargarDatos();
    const user:any = localStorage.getItem("usuario");
    this.prmUsrAplBarReg = {
      tabla: "Tablero",
      aplicacion: "ADM-300",
      usuario: user,
      accion: "r_ini",
      error: "",
      r_numReg: 0,
      r_totReg: 0,
      operacion: {}
    };
    this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
    this.appointmentsData = [];
    this.currentDate= new Date(2021, 4, 11);
    
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // ****** Adiciona a la página de tareas la aplicacion seleccionada ******
  // Buscar en el arbol de aplicaciones si es una aplicacion
  // Abrir la aplicacion si no está abierta
  public abrirApl(item:any){
    item.desplegar = !item.desplegar;
    const listaTab = this.tabService.tabs.find(c => c.aplicacion === item.ID_APLICACION);
    const compo:any = tabs.find(c => c.aplicacion === item.ID_APLICACION);
        
    if (listaTab === undefined) {
      // Adicione a la lista de aplicaciones abiertas
      GlobalVariables.listaAplicaciones.unshift({ aplicacion: item.ID_APLICACION, barra: undefined, statusEdicion: '' });

      // Crea pestaña contenedora de la aplicación
      this.tabService.addTab(
          new Tab(compo.component, 
                  item.NOMBRE, 
                  { parent: "PrincipalComponent" }, 
                  item.ID_APLICACION,
                  item.icon,
                  item.TABLA_APLICACION,
                  true));
      
      // Adiciona a las más usadas
      const prm = { aplicacion: item.ID_APLICACION, 
                    ip: this._sdatos.getIPAddress, 
                    usuario: localStorage.getItem('usuario') }
      this._sdatos.consulta('uso aplicacion',prm,'generales').subscribe((data: any)=> {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
      });
    }

    // Si existe, activa Tab
    else {
      const indexTab = this.tabService.tabs.findIndex(c => c.aplicacion === item.ID_APLICACION);
      this.tabService.activaTab(indexTab);
    }

  }

  // Top de compras
  genTopCompras() {
    let prm = {GRUPOS: '', PROVEEDORES: '', COMPRAS: '', BODEGAS: '100', TIPO: 'JSON'};
    // Ejecuta búsqueda API
    this.loadingVisible = true;

    // this.s_COM01.getGenerar('consulta', prm).subscribe((data: any) => {
		// 	const res = JSON.parse(data.data);
		// 	const mensaje = res[0].ErrMensaje;
		// 	if (mensaje != '') {
		// 		if( mensaje != 'No hay registros en la base de datos')
		// 			this.showModal(mensaje);
		// 	}
		// 	else {
		// 		this.DCompras = res;
    //     for (let i = 0; i < this.DCompras.length; i++) {
    //       this.DCompras[i].ITEM = i+1;
    //       if (this.DCompras[i].CANT_BODEGA > 0 && this.DCompras[i].PUNTO_MAXIMO !== 0) {
    //         if (this.DCompras[i].CANT_BODEGA > this.DCompras[i].PUNTO_MAXIMO) {
    //           this.DCompras[i].MARCA_MIN = this.DCompras[i].PUNTO_MINIMO / this.DCompras[i].CANT_BODEGA * 100;
    //           this.DCompras[i].PORCENTAJE = 100;
    //           this.DCompras[i].color_ind = 'bg-success';
    //           this.DCompras[i].ORDEN = 100;
    //         }
    //         if (this.DCompras[i].CANT_BODEGA <= this.DCompras[i].PUNTO_MAXIMO) {
    //           this.DCompras[i].MARCA_MIN = this.DCompras[i].PUNTO_MINIMO / this.DCompras[i].PUNTO_MAXIMO * 100;
    //           this.DCompras[i].PORCENTAJE = this.DCompras[i].CANT_BODEGA / this.DCompras[i].PUNTO_MAXIMO * 100;
    //           this.DCompras[i].color_ind = 'bg-warning';
    //           this.DCompras[i].ORDEN = -this.DCompras[i].PORCENTAJE;
    //         }
    //         if (this.DCompras[i].CANT_BODEGA < this.DCompras[i].PUNTO_MINIMO) {
    //           this.DCompras[i].color_ind = 'bg-danger';
    //           this.DCompras[i].ORDEN = -this.DCompras[i].PORCENTAJE * 200;
    //         }
    //       }
    //       else {
    //         this.DCompras[i].MARCA_MIN = 100;
    //         this.DCompras[i].PORCENTAJE = this.DCompras[i].CANT_BODEGA !== 0 ? 100 : 0;
    //         this.DCompras[i].color_ind = 'bg-success';
    //         this.DCompras[i].ORDEN = 200;
    //       }
    //     }
    //     this.DCompras.sort((a:any, b:any) => 0 - (a.ORDEN > b.ORDEN ? -1 : 1));
		// 	};
    //   this.loadingVisible = false;
		// });
    // this.visible = true;
  }

  // Activa menu de apl del usuario
  abrirListaFav() {
    this.visibleListaFav = true;
  }
  clickAplFav(e:any) {
    // Toma la selección y adiciona/elimina favoritas
    this.tblFavoritas = [];
    for (var k=0; k < this.seleccAplFavUsr.length; k++) {
      const apl = this.tblAplUsr.find((a:any) => a.ID_APLICACION === this.seleccAplFavUsr[k]);
      this.tblFavoritas.push(apl);
    }
    this.visibleListaFav = false;
  }

  public tableHeader: string[] = [
    'Project',
    'Responsible',
    'Client contact',
    'Deadline',
    'Progress',
  ];
  public data: any[] = [
    {
      project: 'Darkboard',
      responsible: [
        {
          color: 'color--light-blue',
          name: 'Alex',
        },
        {
          color: 'background-color--primary',
          name: 'Dina',
        },
        {
          color: 'color--orange',
          name: 'Misha',
        },
      ],
      email: 'Luke@skywalker.com',
      deadline: 'Jun 15',
      progress: 44,
      isSelected: false,
    },
    {
      project: 'Big financial app',
      responsible: [
        {
          color: 'color--orange',
          name: 'Vlada',
        },
      ],
      email: 'Boss@financial.com',
      deadline: 'Mar 1',
      progress: 14,
      isSelected: true,
    },
    {
      project: 'New Year office decoration',
      responsible: [
        {
          color: 'background-color--primary',
          name: 'Dina',
        },
        {
          color: 'color--orange',
          name: 'Vlada',
        },
      ],
      email: 'info@creativeit.io',
      deadline: 'Dec 25',
      progress: 100,
      isSelected: false,
    },
    {
      project: 'Don\'t worry, be happy!!!',
      responsible: [
        {
          color: 'background-color--secondary',
          name: 'Everybody',
        },
      ],
      email: 'Contact@happyness.com',
      deadline: 'Yesterday',
      progress: 31,
      isSelected: false,
    },
  ];

  showModal(mensaje:any, titulo = 'Error!', msg_html= '') {
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
