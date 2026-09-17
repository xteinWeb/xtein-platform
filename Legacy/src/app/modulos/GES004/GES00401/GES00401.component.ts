import {
    DxDataGridModule,
    DxDropDownBoxModule,
    DxButtonModule,
    DxFormModule,
    DxSelectBoxModule,
    DxPopupModule,
    DxTabPanelModule,
    DxTextBoxModule,
    DxValidatorModule,
    DxLoadPanelModule,
    DxDataGridComponent,
    DxTextAreaModule,
} from 'devextreme-angular';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TabService } from 'src/app/containers/tabs/tab.service';
import { SfiltroService } from 'src/app/shared/filtro/_sfiltro.service';
import { GlobalVariables } from 'src/app/shared/common/global-variables';
import { SvisorService } from 'src/app/shared/vistarapida/_svisor.service';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import { clsUS_Asociadas, FGrupos, FSGrupos } from './clsGES00401.class';
import { showToast } from '../../../shared/toast/toastComponent';
import { validatorRes } from 'src/app/shared/validator/validator.js';
import { GES00401service } from 'src/app/services/GES00401/GES00401.service';
import { BarraimgComponent } from 'src/app/shared/barraimg/barraimg.component';
import { firstValueFrom, Subject } from 'rxjs';
import { AngularSplitModule } from 'angular-split';
import { AngularResizeEventModule } from 'angular-resize-event';
import { GeneralesService } from 'src/app/services/generales/generales.service';

@Component({
    selector: 'app-GES00401',
    templateUrl: './GES00401.component.html',
    styleUrls: ['./GES00401.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        DxFormModule,
        DxPopupModule,
        DxButtonModule,
        DxTextBoxModule,
        DxDataGridModule,
        DxTabPanelModule,
        DxLoadPanelModule,
        DxValidatorModule,
        DxTextAreaModule,
        DxSelectBoxModule,
        DxDropDownBoxModule,
        AngularSplitModule,
        AngularResizeEventModule
    ],
    providers: [AngularResizeEventModule]

})
export class GES00401Component implements OnInit {
    @ViewChild('gridGrupos', { static: false })
    gridGrupos: DxDataGridComponent;


    // Variables fijas de la aplicación
    VDatosReg: any[] = [];
    readOnly: boolean;
    mnuAccion: string;
    data_prev: any = '';
    FGrupos: FGrupos;
    conCambios: number = 0;
    Itm_Usuarios: any[] = [];
    DUsuarios: any = [];
    isGridBoxOpened: boolean = false;

    templateGroup: any = ['ID_EMPLEADO'];
    esEdicion: boolean = false;
    iniEdicion: boolean = false;
    validatorForm: boolean = false;
    esVisibleSelecc: string = 'none';
    prmUsrAplBarReg: clsBarraRegistro;
    activeFormCalidad: boolean = false;
    datEmp: any;
    imageError: string = '';
    selectGroup: any[] = [];
    DGrupos: any[] = [];

    filaDatosEdit: any;
    modoImagen: boolean = false;

    // miembros = new Set<string>();
    miembros: any = [];

    accionAct: any = '';
    activeBtn: boolean = false;
    activeBtnEliminar: boolean = false;
    rowDeleteTree: boolean = false;

    // Notificaciones
    toaVisible: boolean;
    loadingVisible: boolean = false;



    readonly IMG_DEFAULT = '../../../assets/img/fotoEmpleadoCargando.svg';

    base64DataFile: any;
    tamArchivoImg: any;
    img_height: number = 0;
    img_width: number = 0;
    imgBase64zip: any;
    archivo: File;

    // Variables de datos
    QFiltro: any;
    USUARIO: any;
    filaData: any = [];
    numFila: number = 0;
    DGrupos_prev: any;
    DSGrupos: FSGrupos;
    DDMsociadas: clsUS_Asociadas[];

    // Operaciones de grid
    rowNew: boolean = true;
    filasSelecc: any[] = [];
    isEdit: boolean = false;
    rowEdit: boolean = false;
    rowSave: boolean = false;
    rowDelete: boolean = false;
    rowApplyChanges: boolean = false;

    constructor(
        private SVisor: SvisorService,
        private tabService: TabService,
        private _sdatos: GES00401service,
        public generalesService: GeneralesService,
        private _sbarreg: SbarraService,
        private _sfiltro: SfiltroService
    ) {
    }

    ngOnInit(): void {
        this.FGrupos = {
            DESCRIPCION: '',
            IMAGEN: '',
            NOMBRE: '',
            USUARIO: ''
        };
        this.USUARIO = localStorage.getItem('usuario')?.toUpperCase();
        this.prmUsrAplBarReg = {
            tabla: "USUARIOS_GESTOR",
            aplicacion: "GES-004",
            usuario: this.USUARIO,
            accion: "r_ini",
            error: "",
            r_numReg: 0,
            r_totReg: 0,
            operacion: { r_nuevo: false, r_modificar: true, r_buscar: false }
        };
        this.mnuAccion = '';
        this.readOnly = false;
        this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
        this.valoresObjetos('grupos');
        this.valoresObjetos('responsables');
        this.accionAct = 'new';

    }

    ngOnDestroy() {
    }



    ValidaDatos(Accion: string): boolean {
        // Valida datos completados de pestaña <Generales>

        if (Accion === 'requerido') {
            if (this.FGrupos.NOMBRE === '') {
                this.showModal(
                    'Error al guardar',
                    'Faltan datos',
                    'No has escrito un nombre para el grupo!'
                );
                return false;
            } else if (this.Itm_Usuarios.length === 0) {
                this.showModal(
                    'Error al guardar',
                    'Faltan datos',
                    'Falta agregar miembros al grupo!'
                );
                return false;
            }
        }
        return true;
    }

    valoresObjetos(obj: string) {
        if (obj === 'grupos') {
            this.loadingVisible = true;
            const prm = {};
            // Ejecuta búsqueda API
            this.loadingVisible = true;
            this._sdatos
                .consulta('GRUPOS', prm, this.prmUsrAplBarReg.aplicacion)
                .subscribe((data: any) => {
                    try {
                        this.loadingVisible = false;
                        const res = JSON.parse(data.data);
                        this._sfiltro.enConsulta = false;
                        if (data.token != undefined) {
                            const refreshToken = data.token;
                            localStorage.setItem('token', refreshToken);
                        }
                        const datares = res;
                        if (datares.length > 0 && datares[0].ErrMensaje === '') {
                            // Asocia datos
                            if (datares ?? '' != '') {
                                // cabecera
                                this.DGrupos = datares;
                            }
                        } else {
                            //notificación
                            if (datares.length !== 0) {
                                showToast(datares[0].ErrMensaje, 'warning');
                            } else if (datares.length === 0) {
                                showToast('No hay grupos', 'warning');
                            }
                            this.prmUsrAplBarReg.accion = 'r_cancelar';
                            this.prmUsrAplBarReg = { ...this.prmUsrAplBarReg, operacion: {} };
                            this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
                            this.gridGrupos.instance.refresh()

                            //this.opBlanquearFormDM();
                        }
                    } catch (error) {
                        this.loadingVisible = false;
                        this._sfiltro.enConsulta = false;
                        this.showModal(error, 'Error');
                    }
                });
        }


        if (obj === 'responsables' || obj === 'todos') {
            const prm: any = {};
            this._sdatos.getResponsables('RESPONSABLES', prm).subscribe(
                (data: any) => {
                    const res = validatorRes(data);
                    if (data.token !== undefined) {
                        const refreshToken = data.token;
                        localStorage.setItem('token', refreshToken);
                    }
                    const newArray = res;
                    const mensaje = newArray[0].ErrMensaje;
                    if (mensaje !== '') {
                        showToast(mensaje, 'Error');
                    } else {
                        for (let i = 0; i < newArray.length; i++) {
                            const element = newArray[i];
                            element.ITEM = i;
                            this.DUsuarios.push(element);
                        }


                    }
                },
                (err: any) => {
                    this.showModal(err.message, 'Error');
                }
            );
        }
        if (obj === 'miembros' || obj === 'todos') {
            const prm = { USUARIO: this.FGrupos.USUARIO };
            this.miembros = [];
            this._sdatos.consulta('consulta adicionales', prm, this.prmUsrAplBarReg.aplicacion).subscribe(
                (data: any) => {
                    const res = validatorRes(data);
                    if (data.token !== undefined) {
                        const refreshToken = data.token;
                        localStorage.setItem('token', refreshToken);
                    }
                    const newArray = res;
                    const mensaje = newArray[0].ErrMensaje;
                    if (mensaje !== '') {
                        showToast(mensaje, 'Error');
                    } else {
                        for (let i = 0; i < newArray.length; i++) {
                            const element = newArray[i];
                            if (element.ESTADO === 'ACTIVO') {
                                this.miembros.push(element.USUARIO_ASOCIADO);
                            }
                        }
                    }
                },
                (err: any) => {
                    this.showModal(err.message, 'Error');
                }
            );
        }
    }




    onInitNewRowPro(e: any) {
        if (this.Itm_Usuarios.length > 0) {
            const item = this.Itm_Usuarios.reduce((ant, act) => {
                return ant.ITEM > act.ITEM ? ant : act;
            });
            e.data.ITEM = item.ITEM + 1;
        } else {
            e.data.ITEM = 1;
        }

        e.data.USUARIO = this.DSGrupos.USUARIO;
        this.numFila = e.data.ITEM;
        this.filaData = e.data;
    }

    selectionGrid(e: any) {
        if (!this.isEdit) {
            this.filasSelecc = e.selectedRowKeys;
            this.numFila = this.Itm_Usuarios.findIndex(
                (d: any) => d.ITEM === e.selectedRowKeys[0]
            );
            if (this.filasSelecc.length > 0) this.rowDelete = true;
            if (this.filasSelecc.length === 1) this.rowEdit = true;
            if (this.filasSelecc.length > 1) this.rowEdit = false;
            if (this.filasSelecc.length === 0) {
                this.rowDelete = false;
                this.rowEdit = false;
            }
        }
    }

    opBlanquearFormDM(): void {
        this.FGrupos = {
            DESCRIPCION: '',
            IMAGEN: '',
            NOMBRE: '',
            USUARIO: ''
        };
        this._sdatos.USUARIO = '';
        this._sdatos.USUARIO_prev = '';
        this.Itm_Usuarios = [];
        this.DGrupos_prev = JSON.parse(JSON.stringify(this.FGrupos));
    }





    showModal(mensaje: any, titulo = '¡Error!', msg_html = '') {
        Swal.fire({
            iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
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

    resizeBase64Img = (base64, newWidth, newHeight) => {
        return new Promise((res, rej) => {
            const img = new Image();
            img.src = base64;
            img.onload = rs => {
                const elem = document.createElement('canvas');
                var ratio = Math.min(newWidth / img.width, newHeight / img.height);
                elem.width = img.width * ratio;  // newX
                elem.height = img.height * ratio;  // newY
                const ctx: any = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width * ratio, img.height * ratio);   //, newX, newY);
                const data = elem.toDataURL();
                res(data);
            }
            img.onerror = error => rej(error);
        })

    };


    getNombreUsuario(usuarioId: string): string {
        if (usuarioId === 'Tú') {
            usuarioId = this.USUARIO ?? '';
        }
        const nombreFilter = this.DUsuarios.filter((usuario: any) => usuario.ID_RESPONSABLE === usuarioId)[0].NOMBRE;
        const parts = nombreFilter.split(' ');

        if (parts.length === 1) return parts[0];
        if (parts.length >= 3) return `${parts[0]} ${parts[2]}`;
        return `${parts[0]} ${parts[1]}`;
    }

    esCreador(usuario: string): boolean {
        const nombreUsuario = usuario === 'Tú' ? this.USUARIO : usuario;
        return nombreUsuario === this.USUARIO;
    }

    getInitials(nombre: string): string {
        const cleanName = nombre === 'Tú' ? this.USUARIO ?? '' : nombre;
        const nombreFilter = this.DUsuarios.filter((usuario: any) => usuario.ID_RESPONSABLE === cleanName)[0].NOMBRE;

        const parts = nombreFilter.split(' ');
        if (parts.length === 1) return parts[0][0];
        if (parts.length >= 3) return parts[0][0] + parts[2][0];
        return parts[0][0] + parts[1][0];
    }

    generarColorPorUsuario(nombre: string): string {
        // Ejemplo simple: hash del nombre a un color pastel
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 70%, 80%)`;
        return color;
    }

    eliminarMiembro(usuarioId: string) {
        this.miembros = this.miembros.filter(m => m !== usuarioId);
    }


    onResized(event: any) {
        const width: number = event.newRect.width;
        const height: number = event.newRect.height;
        const constainer_expandir: any = document.getElementById('constainer-expandir');
        if (constainer_expandir !== null && constainer_expandir !== undefined) {
            if (width < 330) {
                constainer_expandir.style.width = '100%';
                constainer_expandir.style.position = 'relative';
            } else {
                constainer_expandir.style.width = '110px';
                constainer_expandir.style.position = 'absolute';
            };
        }
    }

    dragEnd(unit: any, sizes: any): any {
        // const ed = this.diagLay.instance.element();
        // ed.style.width = sizes[1];
    }

    deleteGroup(e: any) {
        let prm = { USUARIO: this.FGrupos.USUARIO, USUARIO_ADMIN: this.USUARIO }
        this._sdatos
            .saveGroup('delete', prm, this.prmUsrAplBarReg.aplicacion)
            .subscribe((resp) => {
                this.valoresObjetos('grupos')

                this.onClickBtn(e, 'LIMPIAR')
            })
    }

    async saveGrupo(e) {
        let URL_IMAGEN: string = '';
        try {
            if (this.archivo !== null && this.archivo !== undefined) {
                URL_IMAGEN = await firstValueFrom(
                    this.generalesService.cargar_archivo(`GES00/${this.archivo.name}`, this.base64DataFile)
                );
                this.FGrupos.IMAGEN = URL_IMAGEN;
            }
            if (this.accionAct === "new") {
                this.miembros.push(this.USUARIO);
            }
            let grupo = {
                "USUARIOS_GESTOR": {
                    "USUARIO": this.FGrupos.USUARIO,
                    "NOMBRE": this.FGrupos.NOMBRE,
                    "DESCRIPCION": this.FGrupos.DESCRIPCION,
                    "TIPO": "Grupo",
                    "PERFIL": "",
                    "PERMISOS": "Todos",
                    "ESTADO": "ACTIVO",
                    "IMAGEN": this.FGrupos.IMAGEN,
                    "USUARIO_ADMIN": this.USUARIO,
                },
                "USUARIOS_GRUPOS": Array.from(this.miembros),
            };
            this._sdatos
                .saveGroup(this.accionAct, grupo, this.prmUsrAplBarReg.aplicacion)
                .subscribe((resp) => {
                    let data = JSON.parse(resp.data)
                    console.log(data[0].USUARIO);
                    if (data[0].USUARIO != '') {
                        this.onClickBtn(e, "LIMPIAR")
                    }

                    this.valoresObjetos('grupos')
                })
        } catch (err) {
            console.error('Error subiendo imagen', err);
        }


    }

    changeNombre(e) {
        this.FGrupos.NOMBRE = e;
    }
    changeDescripcion(e) { this.FGrupos.DESCRIPCION = e }


    onClickBtn(e: any, btn: any) {
        switch (btn) {
            case 'ACEPTAR':
                if (this.accionAct === '') {
                    this.accionAct = 'new';
                }
                this.saveGrupo(e);
                break;

            case 'LIMPIAR':
                this.FGrupos = {
                    DESCRIPCION: '',
                    IMAGEN: '',
                    NOMBRE: '',
                    USUARIO: ''
                };
                this.miembros = [];
                // this.activeBtn = true;
                this.accionAct = 'new';
                this.activeBtnEliminar = true;
                break;

            case 'ELIMINAR':
                this.deleteGroup(e);
                break;

            default:
                break;
        }

    }

    onSelectUsuarios(e: any) {
        // Agregar los que no existen aún
        if (e.selectedRowKeys.length > 0) {

            for (const element of e.selectedRowKeys) {
                if (!this.miembros.some(m => m === element)) {
                    this.miembros.push(element);
                }
            }
        }

        if (e.currentDeselectedRowKeys.length > 0) {
            for (const element of e.currentDeselectedRowKeys) {
                this.miembros = this.miembros.filter(m => m !== element);
            }

        }

        // Quitar los que ya no están seleccionados
        // this.selectedRowKeys = this.miembros.filter(m => e.selectedRowKeys.includes(m));

    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const max_height = 15200;
        const max_width = 25600;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onload = async (e: any) => {

                var fileType = file.type;
                this.base64DataFile = e.target.result;
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
                            this.showModal(this.imageError);
                        } else {
                            // Guarda archivo en la url
                            this.tamArchivoImg = file.size;
                            this.img_height = rs.currentTarget['height'];
                            this.img_width = rs.currentTarget['width'];
                            this.archivo = file;

                        }
                    };
                }
            };
            this.getImagenSegura();
            reader.readAsDataURL(file); // convierte a base64 para mostrar
        }
    }

    getImagenSegura(): string {
        const imagen: any = this.archivo;

        if (!imagen && this.FGrupos.IMAGEN === '') return this.IMG_DEFAULT;

        if (this.FGrupos.IMAGEN !== '') {
            const esURL = this.FGrupos.IMAGEN.startsWith('http://') || this.FGrupos.IMAGEN.startsWith('https://');
            return (esURL) ? this.FGrupos.IMAGEN : this.IMG_DEFAULT;
        }

        // Si es un archivo (File o Blob)
        if (imagen.type === "image/png") {
            return URL.createObjectURL(imagen);
        }

        // Cualquier otra cosa no válida
        return this.IMG_DEFAULT;
    }


    esImagenPorDefecto(): boolean {
        return this.getImagenSegura() === this.IMG_DEFAULT;
    }

    onSelectionGroup(e: any) {

        this.FGrupos.USUARIO = e.selectedRowsData[0].USUARIO;
        this.FGrupos.NOMBRE = e.selectedRowsData[0].NOMBRE;
        this.FGrupos.DESCRIPCION = e.selectedRowsData[0].DESCRIPCION;
        this.FGrupos.IMAGEN = e.selectedRowsData[0].IMAGEN;
        this.valoresObjetos('miembros');
        this.accionAct = 'update';

        this.activeBtnEliminar = true;
    }

    miembrosArray(): string[] {
        return this.miembros;
    }
}