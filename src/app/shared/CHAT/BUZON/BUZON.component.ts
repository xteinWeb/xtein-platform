import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DxButtonModule, DxListModule, DxScrollViewComponent, DxScrollViewModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { GeneralesService } from 'src/app/services/generales/generales.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { ApiRestService } from 'src/app/services/usuarios/api-rest.service';
import { showToast } from 'src/app/shared/toast/toastComponent.js';
import { validatorRes } from 'src/app/shared/validator/validator.js';

@Component({
    selector: 'app-BUZON',
    templateUrl: './BUZON.component.html',
    styleUrls: ['./BUZON.component.css'],
    imports: [CommonModule, DxButtonModule, DxTextBoxModule, DxListModule, MatDividerModule, DxListModule,
        DxScrollViewModule, DxTextAreaModule, MatBadgeModule
    ],
    providers: [DatePipe]
})
export class BUZONComponent {

  @ViewChild('scrollViewBodyChat', { static: false }) scrollViewBodyChat: DxScrollViewComponent;

  subscriptionHchat: Subscription;
  subscriptionMensajes: Subscription;
  subscriptionMensagesAct: Subscription;
  subscriptionSaveMensage: Subscription;

  DUsuarios: any[] = [];
  DListaChats: any[] = [];
  selectUsuario: any[] = [];
  Darchivos: any = [];
  
  img_height: number = 0;
  img_width: number = 0;

  infoChatActivo: any = {};
  data_prev_mensaje: any = {};
  
  // img:any;
  base64DataFile: any;
  mesajeText: string = '';
  archivoDoc: any;
  USUARIO_LOCAL: any = '';
  EMPRESA: any = '';
  
  visibleListaChats: boolean = false;
  activeChatUser: boolean = false;
  activeSendBtn: boolean = false;
  mostrarSubirArchivos: boolean = false;
  indAsoArchivo: boolean = false;
  
  constructor(
    private _sgenerales: GeneralesService,
    private sData: ApiRestService,
    public wsocket: SocketService,
    private datepipe: DatePipe
  ) { 
    this.subscriptionHchat = this.wsocket
    .emitHistorialChat()
    .subscribe((prm) => {
      this.listarChats(prm)
    });

    this.subscriptionMensajes = this.wsocket
    .emitHistorialMensajes()
    .subscribe((prm) => {
      this.listarMensajes(prm)
    });

    this.subscriptionMensagesAct = this.wsocket.emitMessage()
    .subscribe((prm) => {
      this.agregarMensajes(prm);
    });

    this.subscriptionSaveMensage = this.wsocket.emitSaveMessage()
    .subscribe((prm) => {
      this.valoresObjetos('listar_mensajes', '');
    });


    this.onClickEliminarArchivo = this.onClickEliminarArchivo.bind(this);

  }

  ngOnInit(): void {
    this.archivoDoc = '';
    this.USUARIO_LOCAL = localStorage.getItem("usuario")?.toUpperCase();
    this.EMPRESA = localStorage.getItem("empresa")?.toUpperCase();
    this.valoresObjetos('todos', '');
  }

  ngOnDestroid(): void {
    this.visibleListaChats = false;
    this.infoChatActivo = {};
    this.mesajeText = '';
    this.archivoDoc = '';
    this.subscriptionHchat.unsubscribe();
    this.subscriptionMensajes.unsubscribe();
    this.subscriptionMensagesAct.unsubscribe();
    this.subscriptionSaveMensage.unsubscribe();
  }

  listarChats(data: any) {
    const res = validatorRes(data);
    if (data.token !== undefined) {
      const refreshToken = data.token;
      localStorage.setItem('token', refreshToken);
    }
    const newArray = res;
    const mensaje = newArray[0].ErrMensaje;
    var contMsj:number = 0;
    if (mensaje !== '') {
      this.DListaChats = [];
    } else {
      newArray.forEach((chat: any) => {
        if (!chat.ES_GRUPO) {
          const npos:any = this.DUsuarios.findIndex((s:any) => s.USUARIO === chat.USUARIO);
          if (npos > -1) {
            chat.FOTO = this.DUsuarios[npos].FOTO;
            chat.iconNameUser = this.DUsuarios[npos].iconNameUser;
            if (chat.FOTO === '' && chat.iconNameUser === '') {
              const pos: any = this.DUsuarios[npos].NOMBRE.indexOf(' ');
              const name = this.DUsuarios[npos].NOMBRE.charAt(0).toUpperCase();
              const lastName = this.DUsuarios[npos].NOMBRE.substring(pos + 1, this.DUsuarios[npos].NOMBRE.length + 1 );
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              this.DUsuarios[npos].iconNameUser = newName;
              this.DUsuarios[npos].FOTO = '';              
              chat.FOTO = this.DUsuarios[npos].FOTO;
              chat.iconNameUser = this.DUsuarios[npos].iconNameUser;
            }
          }

        } else if (chat.ES_GRUPO) {
          if (chat.FOTO === '') {
            const pos: any = chat.NOMBRE_CHAT.indexOf(' ');
            const name = chat.NOMBRE_CHAT.charAt(0).toUpperCase();
            const lastName = chat.NOMBRE_CHAT.substring(pos + 1, chat.NOMBRE_CHAT.length + 1 );
            const Lape = lastName.charAt(0).toUpperCase();
            const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
            chat.iconNameUser = newName;
          }
        }
        if (chat.CONT_MENSAJES > 0)
          contMsj = contMsj + 1;
      });
      this.wsocket.setBadgeMensajes({NUM: contMsj, ACCION: 'resetear'});
      const dChatsL = JSON.parse(JSON.stringify(newArray));
      this.DListaChats = JSON.parse(JSON.stringify(
        dChatsL.sort((a:any, b:any) => {
          const dateA = a.FECHA_UPDATE ? new Date(a.FECHA_UPDATE).getTime() : 0;
          const dateB = b.FECHA_UPDATE ? new Date(b.FECHA_UPDATE).getTime() : 0;
          return dateB - dateA;
        })
      ));

      if (this.activeChatUser && this.infoChatActivo.ID_CHAT) {
        this.valoresObjetos('listar_mensajes', '');
      }
    }
  }

  listarMensajes(data: any) {
    const res = validatorRes(data);
    const newArray = res;
    const mensaje = newArray[0].ErrMensaje;
    if (mensaje !== '') {
      this.infoChatActivo.MENSAJES = [];
    } else {
      newArray.forEach((msj:any) => {
        if (msj.USUARIO_ENV !== this.USUARIO_LOCAL) {
          var pos:any = this.infoChatActivo.USUARIOS.findIndex((d:any) => d.USUARIO === msj.USUARIO_ENV);
          const NOMBRE_CHAT:String = this.infoChatActivo.USUARIOS[pos].NOMBRE;
          pos = NOMBRE_CHAT.indexOf(' ');
          const name = NOMBRE_CHAT.charAt(0).toUpperCase();
          const lastName = NOMBRE_CHAT.substring(pos + 1, NOMBRE_CHAT.length + 1 );
          const Lape = lastName.charAt(0).toUpperCase();
          const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
          msj.iconNameUser = newName;
          var nombreMsj = NOMBRE_CHAT.split(' ')
          msj.NOMBRE_MSJ = nombreMsj[0] + (nombreMsj[2] ? ' ' + nombreMsj[2] : (nombreMsj[1] ? ' ' + nombreMsj[1] : ''));
        }
      });
      this.infoChatActivo.MENSAJES = JSON.parse(JSON.stringify(newArray));
      this.data_prev_mensaje = JSON.parse(JSON.stringify(this.infoChatActivo.MENSAJES));
      setTimeout(() => {
        if (this.scrollViewBodyChat?.instance) {
          this.scrollViewBodyChat.instance.scrollTo({ top: this.scrollViewBodyChat.instance.scrollHeight() });
        } else {
          console.warn('scrollViewBodyChat no está definido o no tiene una instancia válida.');
        }
      }, 400);
      
    }
  }

  formatearFecha(fechaStr: string | Date): string {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    // Normalizar a medianoche para comparación sin hora
    const sinHora = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const fechaSinHora = sinHora(fecha);
    const hoySinHora = sinHora(hoy);
    const ayerSinHora = sinHora(ayer);

    // Día de la semana de hoy (0 = domingo)
    const diaSemanaHoy = hoy.getDay();
    const primerDiaSemana = new Date(hoySinHora);
    primerDiaSemana.setDate(hoySinHora.getDate() - diaSemanaHoy); // Inicio de la semana (domingo)

    if (fechaSinHora.getTime() === hoySinHora.getTime()) {
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // HH:mm
    } else if (fechaSinHora.getTime() === ayerSinHora.getTime()) {
      return 'Ayer';
    } else if (fechaSinHora >= primerDiaSemana) {
      // Retorna el nombre del día (Ej: 'lunes')
      const fe:any = fecha.toLocaleDateString('es-CO', { weekday: 'long' });
      return fe.charAt(0).toUpperCase() + fe.slice(1);
    } else {
      // Formato: dd/mm/aaaa
      return fecha.toLocaleDateString('es-CO');
    }
  }

  agregarMensajes(data: any) {
    
    const dChatsL = JSON.parse(JSON.stringify(this.DListaChats));
    this.DListaChats = [];

    const npos:any = dChatsL.findIndex((d:any) => d.ID_CHAT === data.ID_CHAT);
    if (npos > -1) {
      dChatsL[npos].MENSAJES = [{...data}];
      dChatsL[npos].CONT_MENSAJES++;
      
      if (this.activeChatUser && this.infoChatActivo.ID_CHAT === data.ID_CHAT)
        this.infoChatActivo.MENSAJES.push(data);
      
      var count:number = 0;
      dChatsL.forEach((ele:any) => {
        if (ele.CONT_MENSAJES > 0)
          count = count++;
      });
      this.DListaChats = JSON.parse(JSON.stringify(
        dChatsL.sort((a:any, b:any) => {
          const dateA = a.FECHA_UPDATE ? new Date(a.FECHA_UPDATE).getTime() : 0;
          const dateB = b.FECHA_UPDATE ? new Date(b.FECHA_UPDATE).getTime() : 0;
          return dateB - dateA;
        })
      ));
      
      this.wsocket.setBadgeMensajes({NUM: count, ACCION: 'resetear'});

      setTimeout(() => {
        if (this.scrollViewBodyChat?.instance) {
          this.scrollViewBodyChat.instance.scrollTo({ top: this.scrollViewBodyChat.instance.scrollHeight() });
        } else {
          console.warn('scrollViewBodyChat no está definido o no tiene una instancia válida.');
        }
      }, 400);


    } else {
      this.valoresObjetos('listar_chats', '');
    }

  }

  saveMensajes(data:any) {
    //si mensaje existe solo cambia el estado
    const dChatsL = JSON.parse(JSON.stringify(this.DListaChats));
    this.DListaChats = [];

    const npos:any = dChatsL.findIndex((d:any) => d.USUARIO === data.USUARIO);
    if (npos > -1) {
      if (dChatsL[npos].MENSAJES) {}

    }
  }

  onSelectionChangedUsuario(e:any, tipo:string, datos:any) {
    switch (tipo) {
      case 'nuevo':
        //Borra chats vacios antes de abrir el nuevo
        for (let i = 0; i < this.DListaChats.length; i++) {
          const ele:any = this.DListaChats[i];
          if (ele.ID_CHAT === null || ele.ID_CHAT === undefined) {
            this.DListaChats.splice(i, 1);
          }
        }
        
        const dChatsL = JSON.parse(JSON.stringify(this.DListaChats));
        this.DListaChats = [];
        this.Darchivos.length = [];

        if (e.addedItems.length > 0) {
          this.infoChatActivo = { ...e.addedItems[0], NOMBRE_CHAT: e.addedItems[0].NOMBRE, MENSAJES: [] };
          const npos: any = dChatsL.findIndex((d:any) => d.USUARIO === this.infoChatActivo.USUARIO );
          if (npos === -1) {
            if (e.addedItems[0].FOTO === '' && e.addedItems[0].iconNameUser === '') {
              const pos: any = e.addedItems[0].NOMBRE.indexOf(' ');
              const name = e.addedItems[0].NOMBRE.charAt(0).toUpperCase();
              const lastName = e.addedItems[0].NOMBRE.substring(pos + 1, e.addedItems[0].NOMBRE.length + 1 );
              const Lape = lastName.charAt(0).toUpperCase();
              const newName: string = name.charAt(0).toUpperCase() + Lape.charAt(0).toUpperCase();
              this.infoChatActivo.FOTO = '';
              this.infoChatActivo.iconNameUser = e.addedItems[0].iconNameUser;
            }
            this.infoChatActivo.FECHA_UPDATE = new Date();
            dChatsL.push({ ...this.infoChatActivo });
          }
          this.DListaChats = JSON.parse(JSON.stringify(
            dChatsL.sort((a:any, b:any) => {
              const dateA = a.FECHA_UPDATE ? new Date(a.FECHA_UPDATE).getTime() : 0;
              const dateB = b.FECHA_UPDATE ? new Date(b.FECHA_UPDATE).getTime() : 0;
              return dateB - dateA;
            })
          ));
          this.activeChatUser = true;
          this.visibleListaChats = false;
        }
        break;
        
      case 'anterior':
        this.Darchivos.length = [];
        if (this.infoChatActivo.ID_CHAT !== datos.ID_CHAT) {
          this.infoChatActivo = JSON.parse(JSON.stringify(datos));
          this.valoresObjetos('listar_mensajes', '');
        }
        const npos: any = this.DListaChats.findIndex((d:any) => d.ID_CHAT === this.infoChatActivo.ID_CHAT );
        if (this.DListaChats[npos].CONT_MENSAJES > 0)
          this.wsocket.setBadgeMensajes({NUM: 1, ACCION: 'restar'});

        this.DListaChats[npos].CONT_MENSAJES = 0;
        this.activeChatUser = true;
        break;
    
      default:
        break;
    }
  }


  showChats(e: any, tipo: string, datos: any) {
    switch (tipo) {
      case 'cerrar':
        this.activeChatUser = false;
        if ((this.infoChatActivo.ID_CHAT === null || this.infoChatActivo.ID_CHAT === undefined) && this.infoChatActivo.MENSAJES.length <= 0) {
          const npos: any = this.DListaChats.findIndex((d:any) => d.USUARIO === this.infoChatActivo.USUARIO );
          if (npos > -1) {
            this.DListaChats.splice(npos, 1);
          }
        }
        // this.DListaChats = this.DListaChats_prev.sort((a:any, b:any) => b.FECHA_UPDATE - a.FECHA_UPDATE);
        this.infoChatActivo = {};
        this.Darchivos = [];
        break;

      default:
        break;
    }
  }

  onValueChangedMessage(e: any) {
    const mensaje = e.value;
    // Verificar si el mensaje consiste solo en espacios en blanco
    if (mensaje.trim() === '') {
      // Deshabilitar el botón de envío
      this.activeSendBtn = false;
    } else {
      // Habilitar el botón de envío
      this.activeSendBtn = true;
    }
  }

  async sendMsj() {
    if (this.activeSendBtn || this.Darchivos.length > 0) {
      if (this.Darchivos.length > 0) {
        for (let i = 0; i < this.Darchivos.length; i++) {
          const element = this.Darchivos[i];
          if (this.tamArchivoImg > 100000) {
            await this.compressImage(element.IMAGEN, 600, 600, this.img_width, this.img_height).then(compressed => {
              this._sgenerales.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, compressed).subscribe((data: any) => {
                element.IMAGEN = data
              });
            })
          } else {
            element.IMAGEN = await firstValueFrom(
              this._sgenerales.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, element.IMAGEN)
            ); 
          }
        }
      }

      this.infoChatActivo.MENSAJES.push({
        ID_CHAT: this.infoChatActivo.ID_CHAT,
        USUARIO_ENV: this.USUARIO_LOCAL,
        USUARIO_REC: this.infoChatActivo.USUARIO,
        DESCRIPCION: this.mesajeText,
        ESTADO: 'Enviando',
        APLICACION: 'BUZON',
        LEIDO: false,
        FECHA_ENVIO: this.datepipe.transform(new Date(), 'MM/dd/yyyy HH:mm:ss'),
        ARCHIVOS: this.Darchivos
      });

      this.Darchivos = [];
      this.mostrarSubirArchivos = false;
      this.mesajeText = '';
      let response: any = {
        USUARIO: this.USUARIO_LOCAL,
        EMPRESA: this.EMPRESA,
        ACCION: 'GUARDAR MENSAJE',
        data: { DATOS: this.infoChatActivo.MENSAJES[this.infoChatActivo.MENSAJES.length - 1] }
      };
      this.wsocket.sendSocket('privateSendMessage', 'get_data_chat_privado', response);

      this.data_prev_mensaje = JSON.parse(JSON.stringify(this.infoChatActivo.MENSAJES));
      if (this.scrollViewBodyChat?.instance) {
        this.scrollViewBodyChat.instance.scrollTo({ top: this.scrollViewBodyChat.instance.scrollHeight() });
      }
      
      this.valoresObjetos('listar_mensajes', '');
    }
  }

  async cargarArchivosUrl() {
    for (let i = 0; i < this.Darchivos.length; i++) {
      const element = this.Darchivos[i];
      if (this.tamArchivoImg > 100000) {
        await this.compressImage(element.IMAGEN, 600, 600, this.img_width, this.img_height).then(compressed => {
          this._sgenerales.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, compressed).subscribe((data: any) => {
            element.IMAGEN = data
          });
        })
      } else {

        element.IMAGEN = await firstValueFrom(
          this._sgenerales.cargar_archivo(`GES00/${element.ARCHIVO.replace(/\s+/g, '')}`, element.IMAGEN)
        ); 

        console.log('URL: '+element.IMAGEN);

      }
    }
  }

  compressImage(src: any, newX: any, newY: any, src_w: any, src_h: any) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.src = src;
      img.onload = rs => {
        const elem = document.createElement('canvas');
        var ratio = Math.min(newX / src_w, newY / src_h);
        elem.width = src_w * ratio;  // newX
        elem.height = src_h * ratio;  // newY
        const ctx: any = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, src_w * ratio, src_h * ratio);   //, newX, newY);
        const data = elem.toDataURL();
        res(data);
      }
      img.onerror = error => rej(error);
    })
  }

  // Cargar archivo
  onClickCargar() {
    this.operArcImg('cargar');
  }

  // Llama al cargue del archivo
  // datArchivo: any;
  operArcImg(operArch: any) {

    // Operación de cargue de archivo
    if (operArch.match('cargar|icon-upload-file-sl')) {
      let input = document.createElement('input');
      // this.datArchivo = archivo;
      input.type = 'file';
      input.multiple = true;
      input.accept = "image/*,video/*,.pdf,.csv";
      this.indAsoArchivo = false;
      input.addEventListener("change", (e) => {
        if (!this.indAsoArchivo) this.fileChangeEvent(e);
      });
      if (!this.indAsoArchivo) input.click();
    }
  }

  imageError: string = '';
  tamArchivoImg: any;
  imgBase64zip: any;
  fileChangeEvent(fileInput: any) {
    var res: boolean = false;
    const signatures = {
      JVBERi0: "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    this.imageError = '';
    this.indAsoArchivo = true;
    for (let i = 0; i < fileInput.target.files.length; i++) {
      const file = fileInput.target.files[i];
      const larch = file.name;
      const tipoArchivo: any = file.type;
      var icon: any = '';

      // Icono segun tipo de archivo
      if (tipoArchivo.includes('image')) {
        icon = 'icon-image-ol';
      } else if (tipoArchivo.includes('pdf')) {
        icon = 'icon-pdf-doc-sl';
      } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheetml') || tipoArchivo.includes('word')) {
        icon = 'icon-doc-ol';
      } else { //otros
        icon = 'icon-link-ol';
      }

      if (this.Darchivos.length === 0) {
        this.Darchivos = [{
          USUARIO: this.USUARIO_LOCAL,
          ITEM: 1,
          ARCHIVO: larch,
          ID_CHAT: this.infoChatActivo.ID_CHAT,
          IMAGEN: '',
          icon: icon,
          TYPE: tipoArchivo
        }];
      } else {
        const item = this.Darchivos.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act });
        this.Darchivos.push({
          USUARIO: this.USUARIO_LOCAL,
          ITEM: item.ITEM + 1,
          NOMBRE_ARCHIVO: larch,
          ID_ACTIVIDAD: this.infoChatActivo.ID_CHAT,
          URL_ARCHIVO: '',
          icon: icon,
          TIPO_ARCHIVO: tipoArchivo
        });
      }

      this.archivoDoc = larch;
      if (fileInput.target.files && file) {
        // Size Filter Bytes
        const max_size = 100000;
        const allowed_types = ['image/png', 'image/jpeg', 'image/jpeg', 'application/pdf'];
        const max_height = 15200;
        const max_width = 25600;
        this.tamArchivoImg = file.size;
        var fileType = '';
        const reader = new FileReader();
        reader.onload = (e: any) => {
          for (var s in signatures) {
            if (e.target.result.indexOf(s) !== 0) {
              var fileType = signatures[s];
              // return
              break;
            }
          }
          this.base64DataFile = e.target.result;
          const npos: any = this.Darchivos.findIndex((d: any) => d.ARCHIVO === larch)
          this.Darchivos[npos].IMAGEN = e.target.result;
          // this.new_data = archivo;
          this.mostrarSubirArchivos = true;
          if (fileType.match('image')) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = async (rs: any) => {
              this.img_height = rs.currentTarget['height'];
              this.img_width = rs.currentTarget['width'];

              if (this.img_height > max_height && this.img_width > max_width) {
                this.imageError =
                  'Máximas dimensiones permitidas: ' +
                  max_height +
                  '*' +
                  max_width +
                  'px';
                showToast(this.imageError);
                res = false;
              } else {
                // Guarda archivo en la url
                const ext = larch.substring(larch.lastIndexOf(".") + 1);
                var imgBase64Path = e.target.result;
                res = true;
              }
            };
          }
        };

        if (this.imageError === '') reader.readAsDataURL(file);

        res = true;
      } else {
        res = false;
      }
    };
    return res;
  }

  onPasteMsj(e: any) {
    this.mostrarSubirArchivos = true;
    const items = e.event.originalEvent.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const file = item.getAsFile();
      if (file) {
        const larch = file.name;
        const tipoArchivo: any = file.type;
        var icon: any = '';

        // Icono segun tipo de archivo
        if (tipoArchivo.includes('image')) {
          icon = 'icon-image-ol';
        } else if (tipoArchivo.includes('pdf')) {
          icon = 'icon-pdf-doc-sl';
        } else if (tipoArchivo.includes('excel') || tipoArchivo.includes('spreadsheetml') || tipoArchivo.includes('word')) {
          icon = 'icon-doc-ol';
        } else { //otros
          icon = 'icon-link-ol';
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          const archivo: any = e.target.result;
          if (this.Darchivos.length === 0) {
            this.Darchivos = [{
              USUARIO: this.USUARIO_LOCAL,
              ITEM: 1,
              ARCHIVO: larch,
              ID_CHAT: this.infoChatActivo.ID_CHAT,
              IMAGEN: archivo,
              icon: 'icon-image-ol',
              TYPE: file.type
            }];
          } else {
            const item = this.Darchivos.reduce((ant: any, act: any) => { return (ant.ITEM > act.ITEM) ? ant : act });
            this.Darchivos.push({
              USUARIO: this.USUARIO_LOCAL,
              ITEM: item.ITEM + 1,
              ARCHIVO: larch,
              ID_CHAT: this.infoChatActivo.ID_CHAT,
              IMAGEN: archivo,
              icon: 'icon-image-ol',
              TYPE: file.type
            });
          }

        };
        reader.readAsDataURL(file);
      }
    }
  }

  onClickEliminarArchivo(e: any, archivo: any) {
    const npos: any = this.Darchivos.findIndex((d: any) => d.ITEM === archivo.ITEM && d.ARCHIVO === archivo.ARCHIVO);
    this.Darchivos.splice(npos, 1);
    if (this.Darchivos.length <= 0) this.mostrarSubirArchivos = false;
  }

  onClickAbrir(archPDF: any, cellInfo: any) {
    // Si está en modo visualizacion, asigna fila de datos
    if (cellInfo !== undefined)
      var new_data:any = cellInfo;

    // Tipos de archivos
    const signatures = {
      JVBERi0: "application/pdf",
      ".pdf": "application/pdf",
      R0lGODdh: "image/gif",
      R0lGODlh: "image/gif",
      iVBORw0KGgo: "image/png",
      TU0AK: "image/tiff",
      "/9j/": "image/jpg",
      UEs: "application/vnd.openxmlformats-officedocument.",
      PK: "application/zip",
    };
    var fileType = '';
    for (var s in signatures) {
      if (new_data.URL_ARCHIVO.indexOf(s) !== -1) {
        fileType = signatures[s];
        break;
      }
    }
    if (fileType.match('image')) {
      var image = new Image();
      image.src = new_data.URL_ARCHIVO;
      var w = window.open("");
      w?.document.write("<style>img{max-width: 75%;}</style>", image.outerHTML);

    } else if (fileType.match('pdf')) {
      let pdfWindow = window.open("");
      pdfWindow?.document.write("<iframe width='100%' height='100%' src='" + new_data.URL_ARCHIVO + "#view=FitH'></iframe>");
    } else {
      showToast('No se puede abrir el archivo.', 'warning');
    }

  }

  valoresObjetos(obj: string, accion: string) {
    let response: any = {
      USUARIO: this.USUARIO_LOCAL,
      EMPRESA: this.EMPRESA
      //ACCION: 'LISTAR CHATS'
    };

    if (obj === 'usuarios' || obj === 'todos') {
      const prm: any = {};
      if (this._sgenerales.D_USUARIOS.length > 0) {
        this.DUsuarios = JSON.parse(
          JSON.stringify(this._sgenerales.D_USUARIOS)
        );
        const npos:any = this.DUsuarios.findIndex((d:any) => d.USUARIO === this.USUARIO_LOCAL);
        if (npos > -1) {
          this.DUsuarios.splice(npos, 1);
        }
        // this.configureUserOnline();
      } else {
        this.sData.getUsuarios('USUARIOS', prm).subscribe((data: any) => {
          const res = validatorRes(data);
          if (data.token !== undefined) {
            const refreshToken = data.token;
            localStorage.setItem('token', refreshToken);
          }
          const newArray = res;
          const mensaje = newArray[0].ErrMensaje;
          if (mensaje !== '') {
            showToast(mensaje, 'error');
          } else {
            // Baja las imagenes
            this._sgenerales
            .bajar_imagen(
              'bajar imagenes',
              {
                RESPONSABLES: [{}],
                params: { comprimir: true, tamX: 300, tamY: 400 },
              },
              'spActividades'
            )
            .subscribe({
              next: (varch: any) => {
                // Adiciona el path en el vector de la galería
                if (varch[0].ErrMensaje === '') {
                  newArray.forEach((eleres: any) => {
                    const ix = varch.findIndex(
                      (r: any) => r.etiqueta === eleres.USUARIO
                    );
                    if (ix !== -1) {
                      eleres.FOTO = varch[ix].path;
                      newArray.forEach((usuario: any) => {
                        if (usuario.USUARIO === eleres.USUARIO) {
                          usuario.FOTO = varch[ix].path;
                        }
                      });
                      eleres.ESTADO = 'OFFLINE';
                    } else {
                      const npos: any = eleres.NOMBRE.indexOf(' ');
                      const name = eleres.NOMBRE.charAt(0).toUpperCase();
                      const lastName = eleres.NOMBRE.substring(
                        npos + 1,
                        eleres.NOMBRE.length + 1
                      );
                      const Lape = lastName.charAt(0).toUpperCase();
                      const newName: string =
                        name.charAt(0).toUpperCase() +
                        Lape.charAt(0).toUpperCase();
                      eleres.iconNameUser = newName;
                      eleres.ESTADO = 'OFFLINE';
                      eleres.FOTO = '';
                    }
                  });
                } else {
                  newArray.forEach((eleres: any) => {
                    const npos: any = eleres.NOMBRE.indexOf(' ');
                    const name = eleres.NOMBRE.charAt(0).toUpperCase();
                    const lastName = eleres.NOMBRE.substring(
                      npos + 1,
                      eleres.NOMBRE.length + 1
                    );
                    const Lape = lastName.charAt(0).toUpperCase();
                    const newName: string =
                      name.charAt(0).toUpperCase() +
                      Lape.charAt(0).toUpperCase();
                    eleres.FOTO = '';
                    eleres.iconNameUser = newName;
                    eleres.ESTADO = 'OFFLINE';
                  });
                }
                this._sgenerales.D_USUARIOS = JSON.parse(
                  JSON.stringify(newArray)
                );
                this.DUsuarios = newArray;
                const npos:any = this.DUsuarios.findIndex((d:any) => d.USUARIO === this.USUARIO_LOCAL);
                if (npos > -1) {
                  this.DUsuarios.splice(npos, 1);
                }
                // this.configureUserOnline();
              },
              error: (err) => {
                showToast('Error procesando imagenes: ' + err.message);
              },
            });
          }
        });
      }
    };
    if (obj === 'listar_chats' || obj === 'todos') {
      // this.loadingVisible = true;
      const prm: any = { USUARIO: this.USUARIO_LOCAL };
      response = {
        data: {
          DATOS: prm
        },
        ACCION: 'LISTAR CHATS',
        ...response
      }
      this.wsocket.sendSocket('listar_chats', 'get_lista_chats', response);
    };
    if (obj === 'listar_mensajes') {
      // this.loadingVisible = true;
      const prm: any = { ID_CHAT: this.infoChatActivo.ID_CHAT, USUARIO: this.USUARIO_LOCAL };
      response = {
        data: {
          DATOS: prm
        },
        ACCION: 'LISTAR MENSAJES',
        ...response
      }
      this.wsocket.sendSocket('listar_mensajes', 'get_lista_mensajes', response);
    };
  }

}
