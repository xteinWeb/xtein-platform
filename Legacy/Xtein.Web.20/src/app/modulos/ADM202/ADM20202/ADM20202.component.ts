import { Component, OnInit, ViewChild } from '@angular/core';
import { DxGalleryComponent, DxGalleryModule } from 'devextreme-angular';
import { ThumbnailimgComponent } from 'src/app/shared/thumbnailimg/thumbnailimg.component';
import { CListaImagenes } from '../clsADM202.class';
import { validatorRes } from 'src/app/shared/validator/validator';
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';
import { Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { ADM202Service } from 'src/app/services/ADM202/ADM202.service';

@Component({
  selector: 'app-ADM20202',
  templateUrl: './ADM20202.component.html',
  styleUrls: ['./ADM20202.component.css'],
  standalone: true,
  imports: [DxGalleryModule],
})
export class ADM20202Component implements OnInit {
  @ViewChild('galleryUDN', { static: false }) galleryUDN: DxGalleryComponent;
  DImagenesThumb: any[];
  slideshowDelay: any;
  mnuAccion: string;
  esEdicion: boolean = false;
  loadingVisible: boolean = false;
  eventsBarraImg: Subject<any> = new Subject<any>();
  imageAtributo: string = '';
  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  galleryTarget: string = 'galleryUDN';

  subscription: Subscription;
  subscriptionReadOnly: Subscription;

  DImagenes: CListaImagenes;

  icon16Url: string = 'assets/icons/icon-16x16.png';
  icon32Url: string = 'assets/icons/icon-32x32.png';
  industrialImgUrl: string = 'assets/icons/industrial.png';

  constructor(
    private sData: ADM202Service,
    private _sgenerales: GeneralesService
  ) {
    this.subscription = this.sData.getObs_Imagen().subscribe((datprm) => {
      this.operCompo(datprm);
    });

    this.subscriptionReadOnly = this.sData.getReadOnly().subscribe((datprm) => {
      this.getReadOnly(datprm);
    });
  }

  ngOnInit(): void {
    this.DImagenes = {
      LOGO16: this.sData.FUDnegocios.LOGO16,
      LOGO32: this.sData.FUDnegocios.LOGO32,
      LOGOSIMBOLO: this.sData.FUDnegocios.LOGOSIMBOLO,
    };
    this.sData.D_Imagen = [];
    this.valoresObjetos('todos');
    this.operCompo({ accion: this.sData.accion });
  }

  operCompo(operMenu: any): void {
    switch (operMenu.accion) {
      case 'r_ini':
        break;

      case 'r_nuevo':
        this.mnuAccion = 'new';
        this.esEdicion = true;
        this.opPrepararNuevo();
        break;

      case 'r_modificar':
        this.mnuAccion = 'update';
        this.esEdicion = true;
        this.opPrepararModificar();
        break;

      case 'r_guardar':
        this.opPrepararGuardar(this.mnuAccion);
        break;

      case 'r_buscar':
        this.opPrepararBuscar('');
        break;

      case 'r_buscar_ejec':
        this.opBlanquearFormi();
        this.opPrepararBuscar('');
        break;

      case 'r_eliminar':
        this.opEliminar();
        break;

      case 'r_primero':
      case 'r_anterior':
      case 'r_siguiente':
      case 'r_ultimo':
      case 'r_numreg':
        this.opIrARegistro(operMenu.accion);
        this.esEdicion = false;
        break;

      case 'r_cancelar':
        this.valoresObjetos('autorizaciones');
        this.eventsBarraImg.next({
          accion: 'inactivar',
          docElem: document,
          target: this.galleryTarget,
        });
        break;

      default:
        break;
    }
  }


  // ...existing code...
  onFileChange(event: any, tipo: string) {
    const file = event.target.files[0];
    if (file) {
      this.sData.D_Imagen.push({ file: file, tipo: tipo });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.DImagenes[tipo] = e.target.result;
      };
      reader.readAsDataURL(file);
      this.tamArchivoImg = file.size;
    }
  }

  onImgError(event: any) {
    event.target.src = 'assets/no-image.jpg';
  }
  // ...existing code...

  opPrepararNuevo() {
    this.eventsBarraImg.next({
      accion: 'activar',
      docElem: document,
      target: this.galleryTarget,
      active: [true, true, true],
    });
  }

  opEliminar() { }

  opPrepararModificar() {
    this.esEdicion = true;
    this.setObsToService('r_modificar');
    this.eventsBarraImg.next({
      accion: 'activar',
      docElem: document,
      target: this.galleryTarget,
      active: [true, true, true],
    });
  }

  opPrepararGuardar(accion: any) {
    this.sData.M_esEdicionImagen = false;
    this.esEdicion = false;
    this.eventsBarraImg.next({ accion: 'inactivar', docElem: document });
  }

  opPrepararBuscar(oper: any) { }

  opBlanquearFormi() {
  }

  opIrARegistro(acc: any) {
    this.valoresObjetos('imagenes');
  }

  valoresObjetos(obj: string) {
    this.loadingVisible = true;
    if (obj == 'imagenes' || obj == 'todos') {
      const prm = { ID_UN: this.sData.FUDnegocios.ID_UN };
      this.sData.consulta('IMAGENES', prm, 'ADM202').subscribe((data: any) => {
        const res = validatorRes(data);
        if (data.token != undefined) {
          const refreshToken = data.token;
          localStorage.setItem('token', refreshToken);
        }
        if (res[0].ErrMensaje === '') {
          this.DImagenes = res;
        } else {
          this.opBlanquearFormi();
        }
      });
    }
    this.loadingVisible = false;
  }
  // Cargar imagenes

  showModal(mensaje: any, titulo: any = '¡Error!', msg_html: any = '') {
    let iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
    if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";
    Swal.fire({
      iconHtml: iconHtml,
      confirmButtonColor: '#0F4C81',
      title: titulo,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html: msg_html,
      stopKeydownPropagation: false,
    });
  }

  setObsToService(accion: any) {
    this.sData.setObs_Identificacion({ accion: accion });
    this.sData.setObs_Imagen({ accion: accion });
    this.sData.setObs_Contabilidad({ accion: accion });
  }

  getReadOnly(datprm: any) {
    this.readOnly = datprm;
  }
  readOnly: boolean = true;

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
