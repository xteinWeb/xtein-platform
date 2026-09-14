// import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
// import Swal from 'sweetalert2';
// import { Subject, Subscription } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
// import { PRO009Service } from 'src/app/services/PRO009/s_PRO009.service';
// import { MEmpleados } from './clsPRO009.class';
// import { clsBarraRegistro } from '../../containers/regbarra/_clsBarraReg';
// import { DxDataGridComponent, getElement } from 'devextreme-angular';
// import { ThisReceiver } from '@angular/compiler';
// import { DetailServiceService } from './service/detail-service.service';
// import { TabService } from 'src/app/containers/tabs/tab.service';
// import { Tab } from 'src/app/containers/tabs/tab.model';
// import { VisorrepComponent } from 'src/app/shared/visorrep/visorrep.component';
// import { GlobalVariables } from 'src/app/shared/common/global-variables';

// @Component({
//   selector: 'PRO009-component',
//   templateUrl: './PRO009.component.html',
//   styleUrls: ['./PRO009.component.css']
// })
// export class PRO009Component implements OnInit, OnDestroy {
// 	@ViewChild("gridContainer", { static: false }) gridEmpleados: DxDataGridComponent;
  
//   subscription: Subscription;
//   subscriptionDet: Subscription;
//   unSubscribe: Subject<boolean> = new Subject<boolean>();
// 	prmUsrAplBarReg: clsBarraRegistro;
// 	mnuAccion: string;
// 	VDatosReg: any;
// 	readOnly: boolean = true;
// 	textButton: string = 'AGREGAR';
// 	esEdicion: boolean = false;
// 	openDrop: boolean = false;
// 	openSeccion: boolean = false;
// 	pasSecc: boolean = false;
// 	esVisibleSelecc: string = 'none';
// 	esVisibleSeleccEmp: boolean = false;
// 	filaDatosEdit: any;
// 	modoImagen: boolean = false;

// 	toaVisible: boolean = false;
// 	type = 'info'
//   toaMessage = 'Registro actualizado!';
// 	loadingVisible: boolean = false;
// 	item: any = '';
// 	filterEmpleado: any ='';
// 	srcFotoEmp: any = '../../../assets/img/fotoEmpleadoCargando.jpg';
// 	visible: boolean = false;
// 	isEdit: boolean = false;
// 	rowDelete: boolean = false;
// 	esEdicionFila: boolean = false;
// 	conCambios: number = 0;
// 	contClick = 0;
// 	idSeccionEnviada: any;
// 	DESCRIPCION: any;

//   DEmpleados: any = [];
// 	VEempleados: any = [];
// 	FEmpleados: MEmpleados;
// 	DSeccion: any = [];
// 	DSeccionesEmpleado: any = [];
// 	VEseccion: any = [];
// 	DGEmpleados: any = [];
// 	DatosEnv: any = [];
//   selectEmpleado: any[] = [];
// 	selectSeccion: any = [];
// 	selected: any = [];
//   seleccEmpleado: any = [];
//   newArray: any = [];
// 	arraySeccion: any = [];
// 	arrayEmpleados: any = [];
// 	DEempleados: any = [];
// 	DGDetalle: any = [];
// 	filasSelecc: any[] = [];
// 	seleccDelete: boolean[] = [false];
// 	altoFilaDatos: string[] = ["10px"];
// 	modoSeleccDelete: boolean = false;
	
//   constructor(
// 		private sData: PRO009Service,
// 		private _sbarreg: SbarraService,
//     private tabService: TabService,
// 		private datosServiceDetail: DetailServiceService
// 		) {
//     this.subscription = this._sbarreg
//       .getObsRegApl()
//       .pipe(takeUntil(this.unSubscribe))
//       .subscribe((dempeg) => {
//         // Valida si la petición es para esta aplicacion
//         if (dempeg.aplicacion === this.prmUsrAplBarReg.aplicacion)
//           this.opMenuRegistro(dempeg);
//       });

// 		this.onSelectionEmpleado = this.onSelectionEmpleado.bind(this);

//   }

//   ngOnInit(): void {
//     this.prmUsrAplBarReg = {
// 			tabla: 'EMPLEADOS_SECCIONES',
// 			aplicacion: 'PRO-009',
// 			usuario: localStorage.getItem('usuario'),
// 			accion: 'r_ini',
// 			error: '',
// 			r_numReg: 0,
// 			r_totReg: 0,
// 			operacion: { r_modificar: true }
// 		};
// 		this.FEmpleados = { ID_EMPLEADO:'',NOMBRE_COMPLETO:'',ESTADO:'',ID_SECCION:'', DESCRIPCION:'', TIPO:'', ACTIVIDAD:''};
// 		this.readOnly = true;
// 		this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 		this.getInfoEmpleados();
// 		this.getEmpleados();
// 		this.getSecciones();
		

// 		this.subscriptionDet = this.datosServiceDetail.getEMPSecciones().subscribe(data => {
// 			switch (data.operacion){
// 				case 'seleccion':
// 					const	pos = this.DGEmpleados.findIndex( d => d.ID_EMPLEADO === data.ID_EMPLEADO );
				
// 					this.FEmpleados.ID_EMPLEADO = this.DGEmpleados[pos].ID_EMPLEADO;
// 					this.FEmpleados.NOMBRE_COMPLETO = this.DGEmpleados[pos].NOMBRE_COMPLETO;
// 					this.FEmpleados.ESTADO = this.DGEmpleados[pos].ESTADO;
// 					this.srcFotoEmp = this.DGEmpleados[pos].FOTO;
// 					this.pasSecc = true;
// 					this.selectEmpleado = [ this.FEmpleados.ID_EMPLEADO ]; // { ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO, NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO, ErrMensaje: '' };

// 					this.FEmpleados.ID_SECCION = data.VDetalle.ID_SECCION;
// 					this.FEmpleados.ACTIVIDAD = data.VDetalle.ID_ACTIVIDAD;
// 					this.FEmpleados.TIPO = data.VDetalle.TIPO;
// 					this.selectSeccion = [ this.FEmpleados.ID_SECCION ]; // { ID_SECCION: this.FEmpleados.ID_SECCION, ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD, TIPO: this.FEmpleados.TIPO };
// 					this.item = data.VDetalle.ITEM;
// 					this.idSeccionEnviada = data.VDetalle.ID_SECCION;

// 					this.textButton = data.textButton;
// 				break;

// 				case 'Msecciones':
// 					const SeccionEmpleado = this.DGDetalle.filter(e => e.ID_EMPLEADO === data.ID_EMPLEADO);
// 					this.datosServiceDetail.setDETSecciones({ SeccionEmpleado, operacion: 'mostrar' });
// 				break;

// 				case 'eliminacion':
// 					if( this.VEseccion.length != 0 ){
// 						let velimsecc = this.VEseccion.filter(f => f.ID_EMPLEADO === data.ID_EMPLEADO);
// 						for (let index = 0; index < velimsecc.length; index++) {
// 							const npos = this.VEseccion.findIndex( d => (d.ID_EMPLEADO === data.ID_EMPLEADO) && (d.ID_SECCION === velimsecc[index].ID_SECCION) );
// 							if (npos != -1){
// 								this.VEseccion.splice(npos, 1);
// 								const	pos = this.DGEmpleados.findIndex( d => d.ID_EMPLEADO === data.VDetalle.ID_EMPLEADO );
// 								this.VEempleados.push({ ID_EMPLEADO: this.DGEmpleados[pos].ID_EMPLEADO,
// 																				NOMBRE_COMPLETO: this.DGEmpleados[pos].NOMBRE_COMPLETO,
// 																				ESTADO: this.DGEmpleados[pos].ESTADO
// 								});
// 							}
// 						};
// 						const	pos = this.DGEmpleados.findIndex( d => d.ID_EMPLEADO === data.VDetalle[0].ID_EMPLEADO );
// 						let row = this.gridEmpleados.instance.getRowElement(pos);
// 						row[0]['style'].backgroundColor = 'lightyellow';
// 						this.conCambios++;
// 					} else {
// 						for (let index = 0; index < data.VDetalle.length; index++) {
// 							this.VEseccion.push({ ID_EMPLEADO: data.VDetalle[index].ID_EMPLEADO,
// 																		ITEM: data.VDetalle[index].ITEM,
// 																		ID_SECCION: data.VDetalle[index].ID_SECCION,
// 																		ID_ACTIVIDAD: data.VDetalle[index].ID_ACTIVIDAD,
// 																		TIPO: data.VDetalle[index].TIPO
// 							});
// 						}
// 						const	pos = this.DGEmpleados.findIndex( d => d.ID_EMPLEADO === data.VDetalle[0].ID_EMPLEADO );
// 						this.VEempleados.push({ ID_EMPLEADO: this.DGEmpleados[pos].ID_EMPLEADO,
// 																		NOMBRE_COMPLETO: this.DGEmpleados[pos].NOMBRE_COMPLETO,
// 																		ESTADO: this.DGEmpleados[pos].ESTADO
// 						});
// 						let row = this.gridEmpleados.instance.getRowElement(pos);
// 						row[0]['style'].backgroundColor = 'lightyellow';
// 						this.conCambios++;
// 					};
// 				break;

// 				default:
// 				break;
			
// 			}
			
// 		})
			
//   }

// 	ngOnDestroy() {
//     this.subscription.unsubscribe();
//     this.subscriptionDet.unsubscribe();
//   }

//   onSelectionEmpleado(e: any) {
// 		if (e.selectedRowsData.length != 0){
// 			this.FEmpleados.NOMBRE_COMPLETO = e.selectedRowsData[0].NOMBRE_COMPLETO;
// 			this.FEmpleados.ID_EMPLEADO = e.selectedRowsData[0].ID_EMPLEADO;
// 			if ( this.pasSecc === false)
// 				this.FEmpleados.ESTADO = 'ACTIVO';
// 			this.filterEmpleado = this.FEmpleados.ID_EMPLEADO;
	
// 			if( this.DGEmpleados.findIndex(m => m.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO ) != -1){

// 				if( this.VEempleados.findIndex(e => e.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO ) == -1){

// 					const npos = this.DEempleados.findIndex( d => d.ID_EMPLEADO === e.data.ID_EMPLEADO );
// 					if( npos === -1){
// 						this.VEempleados.push({ ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																		NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																		ESTADO: this.FEmpleados.ESTADO
// 																	});
// 					} else {
// 						this.VEempleados.splice( npos, 1 );
// 					}
// 					this.gridEmpleados.instance.expandRow(this.FEmpleados.ID_EMPLEADO);
// 					const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 					this.DSeccionesEmpleado = seccemp;
// 					const fotoEmpl = this.DEmpleados.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 					if ( fotoEmpl[0].FOTO != ''  )
// 						this.srcFotoEmp = fotoEmpl[0].FOTO;
// 				}

// 			} else {
// 				if( this.VEempleados.findIndex(e => e.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO ) == -1){
// 					const ID_UN = localStorage.getItem('empresa');
// 					const npos = this.DEempleados.findIndex( d => d.ID_EMPLEADO === e.selectedRowsData[0].ID_EMPLEADO );
// 					if( npos === -1){
// 						this.VEempleados.push({ ID_UN: ID_UN,
// 																		ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																		ESTADO: this.FEmpleados.ESTADO,
// 																		NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																		isEdit: true
// 																	});
// 					} else {
// 						this.VEempleados.splice( npos, 1 );
// 					}
				
// 					this.DGEmpleados.push({ ID_UN: ID_UN,
// 																	ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ESTADO: this.FEmpleados.ESTADO,
// 																	NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																	isEdit: true
// 																});
// 					this.gridEmpleados.instance.expandRow(this.FEmpleados.ID_EMPLEADO);
// 					const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 					this.DSeccionesEmpleado = seccemp;
// 					const fotoEmpl = this.DEmpleados.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 					if ( fotoEmpl[0].FOTO != ''  )
// 						this.srcFotoEmp = fotoEmpl[0].FOTO;
// 				}
// 			}
// 			this.openDrop = false;
// 		} else {
// 			this.FEmpleados.NOMBRE_COMPLETO = '';
// 			this.FEmpleados.ID_EMPLEADO = '';
// 			this.FEmpleados.ESTADO = '';
// 			this.filterEmpleado = '';
// 		}

// 	}

// 	onSelectionSeccion(e: any) {
//     if ( e.selectedRowsData.length === 0 ){
// 			this.FEmpleados.ID_SECCION = '';
// 			this.FEmpleados.ACTIVIDAD = '';
// 			this.FEmpleados.TIPO = '';
// 			this.textButton = 'AGREGAR';
// 			return;
// 		} else {

// 			if (this.selectEmpleado.length === 0){
// 				e.isValid = false;
// 				const type ='error';
// 				this.type = type;
// 				this.toaMessage = 'Seleccione un Empleado';
// 				this.toaVisible = true;
// 				this.selectSeccion = [];
// 				return;
// 			}

// 			if( this.VEseccion.length != 0 ){
// 				if( this.VEseccion.findIndex(m => m.ID_SECCION == this.selectSeccion.ID_SECCION ) != -1){
// 					this.readOnly = false;
// 					this.textButton = 'ACTUALIZAR';
// 					const npos = this.VEseccion.findIndex(e => e.ID_SECCION === this.selectSeccion.ID_SECCION);
// 					this.item = this.VEseccion[npos].ITEM;
// 					this.FEmpleados.ID_SECCION = this.VEseccion[npos].ID_SECCION;
// 					this.FEmpleados.ACTIVIDAD = this.VEseccion[npos].ID_ACTIVIDAD;
// 					this.FEmpleados.TIPO = this.VEseccion[npos].TIPO;
// 				} else {
// 					this.item = e.selectedRowsData[0].ITEM;
// 					this.FEmpleados.ID_SECCION = e.selectedRowsData[0].ID_SECCION;
// 				};
// 			} else {
// 				this.item = e.selectedRowsData[0].ITEM;
// 				this.FEmpleados.ID_SECCION = e.selectedRowsData[0].ID_SECCION;
// 			}
// 			this.openSeccion = false;
// 		}
//   }

// 	onSeleccDelete(e, datos) {

//     // Activa modo seleccion para borrado
//     this.modoSeleccDelete = true;

//     // Si marcó/desmarcó todas
//     if (datos === 'all') {
//       for (var k=0; k<=this.DGEmpleados.length; k++) {
//         this.seleccDelete[k] = e.value;
//       }
//       this.rowDelete = e.value;
//       return;
//     }

//     // Activa la fila
//     this.seleccDelete[datos.data.ITEM] = e.value;
//     if (this.seleccDelete.findIndex(d => d === true) !== -1) {
//       this.rowDelete = true;
//     }
//     else {
//       this.rowDelete = false;
//     }
//     this.filasSelecc = [];
//     for (var k=0; k < this.seleccDelete.length; k++) {
//       if (this.seleccDelete[k])
//         this.filasSelecc.push(k);
//     }
//   }

// 	toggleWithTemplate(emp) {
//     if (!emp.data.FOTO.match('no-image')) {
//       emp.data.verZoom = !emp.data.verZoom;
//     }
//   }

// 	// Llama al cargue del archivo
//   datEmp: any;
//   operArcImg(operArch, emp) {
// 		if ( emp.length != 0 ) {
// 			// Operación de cargue de archivo
// 			const empData = this.DEmpleados.filter((d:any) => d.ID_EMPLEADO === emp[0]);
// 			if(operArch.match('cargar|cargar prev')) {
// 				this.datEmp = empData;
// 				let input = document.createElement('input');
// 				input.type = 'file';
// 				input.accept="image/*";
// 				input.onchange = (e) => {
// 					this.fileChangeEvent(e, this.datEmp);    
// 				}
// 				input.click();
// 			}
// 			//Elimina archivo
// 			else {
// 				empData[0].FOTO = "";
// 				this.srcFotoEmp = "../../../assets/img/fotoEmpleadoCargando.jpg";
// 			}
// 		} else {
// 			const type ='error';
// 			this.type = type;
// 			this.toaMessage = 'Seleccione empleado!';
// 			this.toaVisible = true;
// 		}
//   }

//   imageError: string = '';
//   fileChangeEvent(fileInput: any, emp: any) {
//     this.imageError = '';
// 		if ( emp.length != 0 ){

// 			if (fileInput.target.files && fileInput.target.files[0]) {
// 				// Size Filter Bytes
// 				const max_size = 120000;
// 				const allowed_types = ['image/png', 'image/jpeg'];
// 				const max_height = 290;
// 				const max_width = 350;
	
// 				const reader = new FileReader();
// 				reader.onload = (e: any) => {
// 					const image = new Image();
// 					image.src = e.target.result;
// 					image.onload = rs => {
// 						const imgBase64Path = e.target.result;
// 						emp[0].FOTO = imgBase64Path;
// 						const base64 = imgBase64Path;
// 						this.filaDatosEdit = emp;
// 						this.modoImagen = true;
						
// 						if (e.total > max_size) {
// 							this.imageError =
// 								'El máximo tamaño no debe supearar los 120 Kbytes ó ' + max_size / 1000000 + 'Mb, la imagen fue modificada!';
// 							// this.showModal(this.imageError);
// 							this.resizeBase64Img(base64, max_width, max_height).then((result)=>{
// 								this.srcFotoEmp = result;
// 								this.sendPhoto(emp, this.srcFotoEmp);
// 							});
// 							return true;
// 						}
// 						this.srcFotoEmp = base64;
// 						this.sendPhoto(emp, this.srcFotoEmp);
// 						return true;						
// 					};
// 				};
	
// 				if (this.imageError === '')
// 					reader.readAsDataURL(fileInput.target.files[0]);
// 				return true;
// 			}
// 			else 
// 				return false;
// 		} else {
// 			const type ='error';
// 			this.type = type;
// 			this.toaMessage = 'Seleccione empleado!';
// 			this.toaVisible = true;
// 			return false;
// 		}
//   }

// 	resizeBase64Img = (base64, newWidth, newHeight) => {
// 		return new Promise((resolve, reject)=>{
// 			var canvas = document.createElement("canvas");
// 			canvas.style.width = newWidth.toString()+"px";
// 			canvas.style.height = newHeight.toString()+"px";
// 			let context = canvas.getContext("2d");
// 			let img = document.createElement("img");
// 			img.src = base64;
// 			img.onload = function () {
// 				context.scale(newWidth/img.width,  newHeight/img.height);
// 				context.drawImage(img, 0, 0); 
// 				resolve(canvas.toDataURL());               
// 			}
// 		});
	
// 	};

// 	sendPhoto(emp, fotoEmp) {
// 		const prm = ({ ID_EMPLEADO: emp[0].ID_EMPLEADO, FOTO: fotoEmp });
// 		// API guardado de datos
// 		this.sData.saveFotoPRO009('SUBIR FOTO', prm).subscribe((data) => {
// 			const res = JSON.parse(data.data);
// 			if ( (data.token != undefined) ){
// 				const refreshToken = data.token;
// 				localStorage.setItem("token", refreshToken);
// 			}
// 			if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
// 				this.showModal(res[0].ErrMensaje);
// 			}
// 			else {
// 				const type ='success';
// 				this.type = type;
// 				this.toaMessage = 'Foto actualizada!';
// 				this.toaVisible = true;

// 				const pos = this.DGEmpleados.findIndex((d:any) => d.ID_EMPLEADO === emp[0].ID_EMPLEADO)
// 				this.DGEmpleados[pos].FOTO =  fotoEmp;
// 			}
// 		});
// 	}

// 	agregarEmpleado= (e: any) => {
// 		if(this.onValidarCampos()){
// 			e.isValid = false;
// 			const type ='error';
// 			this.type = type;
// 			this.toaMessage = 'Hay datos nulos, complete toda la información!';
// 			this.toaVisible = true;
// 		} else {

// 			this.loadingVisible = true;

// 			const ID_UN = localStorage.getItem('empresa');

// 			if( this.DGEmpleados.findIndex(m => m.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO ) == -1) {
// 				const npos = this.VEempleados.findIndex(d => this.FEmpleados.ID_EMPLEADO);

// 				if( this.VEseccion == '') {
// 					this.DGEmpleados.push({ ID_UN: ID_UN, ID_EMPLEADO: this.VEempleados[npos].ID_EMPLEADO,
// 																	ESTADO: this.VEempleados[npos].ESTADO,
// 																	NOMBRE_COMPLETO: this.VEempleados[npos].NOMBRE_COMPLETO,
// 																	isEdit: true
// 																});
// 					this.conCambios++;
// 				} else {
// 					//Validar tipo principal
// 					if(this.FEmpleados.TIPO === 'PRINCIPAL' ) {
						
// 						if( this.VEseccion.findIndex(m => m.TIPO === 'PRINCIPAL' ) != -1) {
// 							e.isValid = false;
// 							const type ='error';
// 							this.type = type;
// 							this.toaMessage = 'El empleado ya es de TIPO PRINCIPAL en una sección!';
// 							this.toaVisible = true;
// 						} else {
// 							this.DGEmpleados.push({ ID_UN: ID_UN,
// 																			ID_EMPLEADO: this.VEempleados[npos].ID_EMPLEADO,
// 																			ESTADO: this.VEempleados[npos].ESTADO,
// 																			NOMBRE_COMPLETO: this.VEempleados[npos].NOMBRE_COMPLETO,
// 																			isEdit: true
// 																		});
// 							this.conCambios++;							
// 						}

// 					} else {
// 						this.DGEmpleados.push({ ID_UN: ID_UN,
// 																		ID_EMPLEADO: this.VEempleados[npos].ID_EMPLEADO,
// 																		ESTADO: this.VEempleados[npos].ESTADO,
// 																		NOMBRE_COMPLETO: this.VEempleados[npos].NOMBRE_COMPLETO,
// 																		isEdit: true
// 																	});
// 						this.conCambios++;
// 					}
// 				};				
				
// 			} else {
// 				//Validar tipo principal
// 				if(this.FEmpleados.TIPO === 'PRINCIPAL' ) {
// 					//verifica si el empleado seleccionado ya regitra TIPO PRINCIPAL
// 					if( this.VEseccion.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) && (d.TIPO === 'PRINCIPAL') ) == -1) {
// 						this.VEseccion.push({ ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ITEM: this.item,
// 																	ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD,
// 																	ID_SECCION: this.FEmpleados.ID_SECCION,
// 																	ID_SECCION_ANT: this.idSeccionEnviada,
// 																	TIPO:this.FEmpleados.TIPO
// 																});
						
// 						const pos = this.DGEmpleados.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO));
// 						this.DGEmpleados.splice( pos, 1,{ ID_UN: ID_UN,
// 																							ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																							ESTADO: this.FEmpleados.ESTADO,
// 																							NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																							isEdit: true
// 						});
						
// 						if ( this.VEempleados.findIndex(f => f.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) === -1) {
// 							this.VEempleados.push({ ID_UN: ID_UN,
// 																			ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																			NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																			ESTADO: this.FEmpleados.ESTADO,
// 																			isEdit: true
// 							});
// 						}

// 						var descipcion = this.DSeccion.filter(d => d.ID_SECCION === this.FEmpleados.ID_SECCION);
// 						this.DESCRIPCION = descipcion[0].DESCRIPCION;

// 						const npos = this.DGDetalle.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) && (d.ID_SECCION === this.FEmpleados.ID_SECCION) );
// 						if (npos !== -1) this.DGDetalle.splice(npos, 1);
// 						this.DGDetalle.push({	ErrMensaje: '',
// 						                      ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ITEM: this.item,
// 																	ID_SECCION: this.FEmpleados.ID_SECCION,
// 																	DESCRIPCION: this.DESCRIPCION,
// 																	ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD,
// 																	TIPO:this.FEmpleados.TIPO,
// 																	isEdit: true
// 																});
// 						const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 						this.DSeccionesEmpleado = seccemp;
																										
// 						this.DGEmpleados.filter(d => d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO)[0].isEdit = true;
// 						const index = this.gridEmpleados.instance.getRowIndexByKey(this.FEmpleados.ID_EMPLEADO);
// 						let row = this.gridEmpleados.instance.getRowElement(index);
// 						row[0]['style'].backgroundColor = 'lightyellow';

// 						this.FEmpleados.ID_SECCION = '';
// 						this.FEmpleados.ACTIVIDAD = '';
// 						this.FEmpleados.TIPO = '';
// 						this.selectSeccion = [];
// 						this.conCambios++;

// 					} else {
// 						e.isValid = false;
// 						const type ='error';
// 						this.type = type;
// 						this.toaMessage = 'El empleado ya es de TIPO: PRINCIPAL en una sección!';
// 						this.toaVisible = true;						
// 					}

// 				}	else {
// 					//VERIFICA SI LA SECCION existe y actualiza
// 					if( this.VEseccion.findIndex(d => (d.ID_SECCION === this.FEmpleados.ID_SECCION) && (e.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO)) != -1 ){
// 						const npos = this.VEseccion.findIndex(d => (d.ID_SECCION === this.FEmpleados.ID_SECCION) && (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO));
					
// 						this.VEseccion.splice( npos, 1, {  ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO, ITEM: this.item, ID_SECCION: this.FEmpleados.ID_SECCION, ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD, TIPO:this.FEmpleados.TIPO });
// 						this.conCambios++;

						
// 						const pos = this.DGEmpleados.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO));
// 						this.DGEmpleados.splice( pos, 1,{ ID_UN: ID_UN,
// 																							ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																							ESTADO: this.FEmpleados.ESTADO,
// 																							NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																							isEdit: true
// 						});
// 						if ( this.VEempleados.findIndex(f => f.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) === -1) {
// 							this.VEempleados.push({ ID_UN: ID_UN,
// 																			ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																			NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																			ESTADO: this.FEmpleados.ESTADO,
// 																			isEdit: true
// 							});
// 						}

// 						var descipcion = this.DSeccion.filter(d => d.ID_SECCION === this.FEmpleados.ID_SECCION);
// 						this.DESCRIPCION = descipcion[0].DESCRIPCION;

// 						const nos = this.DGDetalle.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) && (d.ID_SECCION === this.FEmpleados.ID_SECCION) );
// 						if (nos !== -1) this.DGDetalle.splice(nos, 1);
// 						this.DGDetalle.push({	ErrMensaje: '',
// 																	ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ITEM: this.item,
// 																	ID_SECCION: this.FEmpleados.ID_SECCION,
// 																	DESCRIPCION: this.DESCRIPCION,
// 																	ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD,
// 																	TIPO:this.FEmpleados.TIPO,
// 																	isEdit: true
// 																});

// 						this.conCambios++;
						
// 					} else {
						
// 						const pos = this.DGEmpleados.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO));
// 						this.DGEmpleados.splice( pos, 1,{ ID_UN: ID_UN,
// 																							ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																							ESTADO: this.FEmpleados.ESTADO,
// 																							NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																							isEdit: true
// 						});
// 						if ( this.VEempleados.findIndex(f => f.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) === -1) {
// 							this.VEempleados.push({ ID_UN: ID_UN,
// 																			ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																			NOMBRE_COMPLETO: this.FEmpleados.NOMBRE_COMPLETO,
// 																			ESTADO: this.FEmpleados.ESTADO,
// 																			isEdit: true
// 							});
// 						}

// 						this.VEseccion.push({ ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ITEM: this.item,
// 																	ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD,
// 																	ID_SECCION: this.FEmpleados.ID_SECCION,
// 																	ID_SECCION_ANT: this.idSeccionEnviada,
// 																	TIPO: this.FEmpleados.TIPO,
// 																	isEdit: true
// 																});

// 						var descipcion = this.DSeccion.filter(d => d.ID_SECCION === this.FEmpleados.ID_SECCION);
// 						this.DESCRIPCION = descipcion[0].DESCRIPCION;
						
// 						const npo = this.DGDetalle.findIndex(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) && (d.ID_SECCION === this.FEmpleados.ID_SECCION) );
// 						if (npo !== -1) this.DGDetalle.splice(npo, 1);
// 						this.DGDetalle.push({	ErrMensaje: '',
// 																	ID_EMPLEADO: this.FEmpleados.ID_EMPLEADO,
// 																	ITEM: this.item,
// 																	ID_SECCION: this.FEmpleados.ID_SECCION,
// 																	DESCRIPCION: this.DESCRIPCION,
// 																	ID_ACTIVIDAD: this.FEmpleados.ACTIVIDAD,
// 																	TIPO: this.FEmpleados.TIPO,
// 																	isEdit: true
// 																});

// 						this.conCambios++;
						
// 					}

// 					/* Refresca secciones en detalle */
// 					const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 					this.DSeccionesEmpleado = seccemp;

// 					this.DGEmpleados.filter(d => d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO)[0].isEdit = true;
// 					this.conCambios++;
// 					const index = this.gridEmpleados.instance.getRowIndexByKey(this.FEmpleados.ID_EMPLEADO);
// 					let row = this.gridEmpleados.instance.getRowElement(index);
// 					row[0]['style'].backgroundColor = 'lightyellow';
					
// 					this.FEmpleados.ID_SECCION = '';
// 					this.FEmpleados.ACTIVIDAD = '';
// 					this.FEmpleados.TIPO = '';
// 					this.selectSeccion = [];
// 				}

// 			}

// 			if(this.toaVisible != true){
// 				if(this.textButton === 'ACTUALIZAR'){
// 					this.textButton = 'AGREGAR';
// 				}
// 			}
// 			this.idSeccionEnviada = '';
// 			this.pasSecc = false;
// 			this.loadingVisible = false;

// 		};
// 	}

// 	enviarData(e) {
// 		const SeccionEmpleado = this.DGDetalle.filter(e => e.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO);
// 		this.datosServiceDetail.setDETSecciones({ SeccionEmpleado, operacion: 'mostrar' });
// 	}

// 	onValidarCampos() {
// 		if((this.FEmpleados.ID_EMPLEADO === '') || (this.FEmpleados.NOMBRE_COMPLETO === '') || (this.FEmpleados.ESTADO === '') ||
// 				(this.FEmpleados.ID_SECCION === '') ||	(this.FEmpleados.ACTIVIDAD === '') || (this.FEmpleados.TIPO === '')) {
// 			return true;
// 			}
// 			else {
// 			return false;
// 		};
// 	}

// 	eliminarDatos(e){
// 		const npos = this.VEempleados.findIndex( d => d.ID_EMPLEADO === e.ID_EMPLEADO );
// 		if( npos === -1 ) {
// 			this.DEempleados.push({ ID_UN: e.ID_UN, ID_EMPLEADO: e.ID_EMPLEADO, NOMBRE_COMPLETO: e.NOMBRE_COMPLETO, ESTADO: e.ESTADO });
// 			this.conCambios++;
// 		} else {
// 			this.VEempleados.splice( npos, 1 );
// 			this.DEempleados.push({ ID_UN: e.ID_UN, ID_EMPLEADO: e.ID_EMPLEADO, NOMBRE_COMPLETO: e.NOMBRE_COMPLETO, ESTADO: e.ESTADO });
// 			this.conCambios++;
// 		}
// 	}

//   // Llama a Acciones de registro
// 	opMenuRegistro(operMenu: clsBarraRegistro): void {
// 		switch (operMenu.accion) {
// 			case "r_ini":
// 				this.prmUsrAplBarReg = {
// 					tabla: 'EMPLEADOS_SECCIONES',
// 					aplicacion: 'PRO-009',
// 					usuario: localStorage.getItem("usuario"),
// 					accion: "r_ini",
// 					error: "",
// 					r_numReg: 0,
// 					r_totReg: 0,
// 					operacion: { r_modificar: true }
// 				};
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			case 'r_nuevo':
// 				this.mnuAccion = "new";
// 				this.opPrepararNuevo();
// 				break;

// 			case 'r_modificar':
// 				this.mnuAccion = "update";
// 				this.opPrepararModificar();
// 				break;

// 			case 'r_guardar':
// 				this.opPrepararGuardar(this.mnuAccion);
// 				break;

// 			case 'r_buscar':
// 				this.opPrepararBuscar();
// 				break;

// 			case 'r_buscar_ejec':
// 				this.opPrepararBuscar();
// 				break;

// 			case 'Primero':
// 			case 'Anterior':
// 			case 'Siguiente':
// 			case 'Ultimo':
// 			case 'IrA':
// 				this.opIrARegistro(operMenu.accion);
// 				break;

// 			case 'r_cancelar':
// 				var mensaje = 'Desea cancelar la operación?';
// 				if (this.conCambios != 0) mensaje = 'Desea cancelar sin guardar cambios?';
// 				Swal.fire({
// 					title: '',
// 					text: mensaje,
// 					icon: 'warning',
// 					showCancelButton: true,
// 					confirmButtonColor: '#DF3E3E',
// 					cancelButtonColor: '#438ef1',
// 					cancelButtonText: 'No',
// 					confirmButtonText: 'Sí, cancelar'
// 					}).then((result) => {
// 					if (result.isConfirmed) {
// 						// Restituye los valores
// 						this.FEmpleados.ID_EMPLEADO = '';
// 						this.FEmpleados.NOMBRE_COMPLETO = '';
// 						this.FEmpleados.ESTADO = '';
// 						this.FEmpleados.ID_SECCION = '';
// 						this.FEmpleados.ACTIVIDAD = '';
// 						this.FEmpleados.TIPO = '';
// 						this.filterEmpleado = '';
// 						this.selectSeccion = [];
// 						this.selectEmpleado = [];
// 						this.mnuAccion = "";
// 						this.visible = false;
// 						this.readOnly = true;
// 						this.esEdicion = false;

// 						const index = this.gridEmpleados.instance.getRowIndexByKey(this.FEmpleados.ID_EMPLEADO);
// 						let row = this.gridEmpleados.instance.getRowElement(index);
// 						row[0]['style'].backgroundColor = '';
// 						this.conCambios = 0;
// 						this.datosServiceDetail.esEdicion = false;
// 						this.esVisibleSelecc = 'none';
// 						this.gridEmpleados.instance.collapseAll(-1);
// 						if( this.textButton === 'ACTUALIZAR')
// 						this.textButton = 'AGREGAR';
// 						this.getInfoEmpleados();
// 						this.prmUsrAplBarReg.accion = 'r_cancelar';
// 						this.prmUsrAplBarReg = {...this.prmUsrAplBarReg, operacion: {} }
// 						this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 					}
// 				});
// 				break;

// 			case 'r_imprimir':
// 				this.imprimirReporte(operMenu.operacion.id_reporte, operMenu.operacion.archivo, operMenu.operacion.data_rpt);
// 				break;

// 			default:
// 				break;
// 		}
// 	}

// 	onSeleccEstado(e: any): void {
//     this.FEmpleados.ESTADO = e.value;
//   }

// 	onSeleccActividad(e: any): void {
//     this.FEmpleados.ACTIVIDAD = e.value;
//   }

// 	onSeleccTipo(e: any): void {
//     this.FEmpleados.TIPO = e.value;
//   }

// 	
// 	opPrepararNuevo(): void {
// 		this.VEempleados = [];
// 		this.VEseccion = [];
// 		this.DEempleados = [];
// 		this.datosServiceDetail.DEsecciones = [];
// 		this.esVisibleSelecc = 'onClick';
// 	}
	
// 	opPrepararModificar(): void {
// 		this.visible = true;
// 		this.esEdicion = true;
// 		this.readOnly = false;
// 		this.esVisibleSelecc = 'onClick';
// 		this.esVisibleSeleccEmp = true;
// 		this.datosServiceDetail.esEdicion = true;
// 	}

// 	opPrepararGuardar(accion: string): void {
// 		if ( this.conCambios != 0 ) {
// 			if(this.datosServiceDetail.DEsecciones != ''){
// 				for (let i = 0; i < this.datosServiceDetail.DEsecciones.length; i++) {
// 					let cont = i;
// 					if( this.VEseccion != ''){
// 						cont = cont - 1;
// 						if( (this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO === this.VEseccion[cont].ID_EMPLEADO) && (this.datosServiceDetail.DEsecciones[i].ID_SECCION === this.VEseccion[cont].ID_SECCION) ){
// 							return
// 						} else {
// 								if( this.VEempleados.findIndex(m => m.ID_EMPLEADO == this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO ) == -1 ){
// 									const npos = this.DGEmpleados.findIndex(m => m.ID_EMPLEADO == this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO )
// 									this.VEempleados.push({ ID_EMPLEADO: this.DGEmpleados[npos].ID_EMPLEADO,
// 																					NOMBRE_COMPLETO: this.DGEmpleados[npos].NOMBRE_COMPLETO,
// 																					ESTADO: this.DGEmpleados[npos].ESTADO
// 																				});
// 								};
// 							this.VEseccion.push(this.datosServiceDetail.DEsecciones[i]);
// 						};
// 					} else {
// 						if( this.VEempleados != '' ){
// 							if( this.VEempleados.findIndex(m => m.ID_EMPLEADO === this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO ) === -1 ){
// 								const npos = this.DGEmpleados.findIndex(m => m.ID_EMPLEADO === this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO )
// 								this.VEempleados.push({ ID_EMPLEADO: this.DGEmpleados[npos].ID_EMPLEADO,
// 																				NOMBRE_COMPLETO: this.DGEmpleados[npos].NOMBRE_COMPLETO,
// 																				ESTADO: this.DGEmpleados[npos].ESTADO
// 																			});
// 							};
// 						} else {
// 							const npos = this.DGEmpleados.findIndex(m => m.ID_EMPLEADO == this.datosServiceDetail.DEsecciones[i].ID_EMPLEADO )
// 							this.VEempleados.push({ ID_EMPLEADO: this.DGEmpleados[npos].ID_EMPLEADO,
// 																			NOMBRE_COMPLETO: this.DGEmpleados[npos].NOMBRE_COMPLETO,
// 																			ESTADO: this.DGEmpleados[npos].ESTADO
// 																		});
// 						}
// 						this.VEseccion.push(this.datosServiceDetail.DEsecciones[i]);
// 					}
// 				};		
// 			}
// 			const prm = ({ DATOS_EMPLEADOS: this.VEempleados, DATOS_SECCIONES: this.VEseccion, DATOS_ELIMINAR: this.DEempleados });
// 			this.loadingVisible = true;
// 			// API guardado de datos
// 			this.sData.savePRO009(accion, prm).subscribe((data) => {
// 				const res = JSON.parse(data.data);
// 				if ( (data.token != undefined) ){
// 					const refreshToken = data.token;
// 					localStorage.setItem("token", refreshToken);
// 				}
// 				if (res[0].ErrMensaje !== '' && res[0].ErrMensaje !== 'VALIDO') {
// 					this.prmUsrAplBarReg.error = 'Error';
// 					this.prmUsrAplBarReg.accion = 'r_guardar';
// 					this.esVisibleSelecc = 'none';
// 					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 					this.showModal(res[0].ErrMensaje);
// 				}
// 				else {
// 					this.prmUsrAplBarReg = {
// 						...this.prmUsrAplBarReg,
// 						error: '',
// 						accion: 'r_guardar',
// 						r_numReg: 0,
// 						r_totReg: 0
// 					};
// 					const type ='success';
// 					this.type = type;
// 					this.toaMessage = 'Registro actualizado!';
// 					this.toaVisible = true;
// 					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

// 					this.FEmpleados.ID_EMPLEADO = '';
// 					this.FEmpleados.NOMBRE_COMPLETO = '';
// 					this.FEmpleados.ESTADO = '';
// 					this.FEmpleados.ID_SECCION = '';
// 					this.FEmpleados.ACTIVIDAD = '';
// 					this.FEmpleados.TIPO = '';
// 					this.filterEmpleado = '';
// 					this.selectSeccion = [];
// 					this.selectEmpleado = [];
// 					this.visible = false;
// 					this.esEdicion = false;
// 					this.datosServiceDetail.esEdicion = false;

// 				}
// 			});
// 			this.esEdicion = false;
// 			this.consultaSeccionesEmpleado();
// 			const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === this.FEmpleados.ID_EMPLEADO) );
// 			this.DSeccionesEmpleado = seccemp;
// 			this.loadingVisible = false;
// 			this.srcFotoEmp = '../../../assets/img/fotoEmpleadoCargando.jpg';
// 		} else {
// 			const type ='error';
// 			this.type = type;
// 			this.toaMessage = 'No hay cambios por guardar!';
// 			this.toaVisible = true;
// 		}
// 	}

// 	opPrepararBuscar(): void {
// 		if (this.prmUsrAplBarReg.accion === 'r_buscar') {
// 			this.readOnly = false;
// 		} else {

// 			this.prmUsrAplBarReg = {
// 				...this.prmUsrAplBarReg,
// 				error: '',
// 				r_numReg: this.VDatosReg.length > 0 ? 1 : 0,
// 				r_totReg: this.VDatosReg.length,
// 				accion: 'r_buscar_ejec'
// 			};
// 			// ...mas operaciones
// 			this.readOnly = false;
// 			this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 		};

// 		this.readOnly = false;
// 	}

// 	opIrARegistro(accion: string): void {
// 		this.prmUsrAplBarReg.accion =
// 			'pos_' + this.prmUsrAplBarReg.accion;
// 		switch (accion) {
// 			case 'Primero':
// 				this.prmUsrAplBarReg.r_totReg = 1;
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			case 'Anterior':
// 				this.prmUsrAplBarReg.r_totReg =
// 					this.prmUsrAplBarReg.r_totReg === 1
// 						? 1
// 						: this.prmUsrAplBarReg.r_totReg - 1;
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			case 'Siguiente':
// 				this.prmUsrAplBarReg.r_totReg =
// 					this.prmUsrAplBarReg.r_totReg === this.VDatosReg.length
// 						? this.VDatosReg.length
// 						: this.prmUsrAplBarReg.r_totReg + 1;
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			case 'Ultimo':
// 				this.prmUsrAplBarReg.r_totReg = this.VDatosReg.length;
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			case 'IrA':
// 				if (this.prmUsrAplBarReg.r_totReg !== 0) {
// 					// Valida si hubo cambio de ordenamiento en el visor
// 					this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);

// 				} else {
// 				}
// 				this.readOnly = false;
// 				break;

// 			case 'Eliminado':
// 				this.VDatosReg.splice(this.prmUsrAplBarReg.r_totReg - 1, 1);
// 				this.prmUsrAplBarReg.r_totReg--;
// 				if (this.prmUsrAplBarReg.r_totReg > this.prmUsrAplBarReg.r_totReg) {
// 					this.prmUsrAplBarReg.r_totReg = this.prmUsrAplBarReg.r_totReg;
// 				}
// 				if (this.VDatosReg.length > 0) {
// 					//
// 				} else {
// 				}
// 				// Status
// 				this.prmUsrAplBarReg.error = '';
// 				this.prmUsrAplBarReg.accion = 'r_eliminar_pos';
// 				this._sbarreg.setObsMenuReg(this.prmUsrAplBarReg);
// 				break;

// 			default:
// 				break;
// 		}

// 		// Trae secciones asociadas a la ruta
// 		this.readOnly = false;


// 	}

// 	onRowPrepared(e) {
// 		if (e.rowType === "data") {			
// 			if (e.data.isEdit) {
				// e.rowElement.style.backgroundColor = 'lightyellow';
			// 	const className:string = e.rowElement.className;
			// 	e.rowElement.className = className +' row-modified-focused';
			// }
			
//     }
// 	}

//   getEmpleados() {
// 		const prm = { DATOS: '' };
// 		this.sData.itemEmpleados('EMPLEADOS', prm).subscribe((data: any) => {

// 			const res = JSON.parse(data.data);
//       if ( (data.token != undefined) ){
//         const refreshToken = data.token;
//         localStorage.setItem("token", refreshToken);
//       }
// 			this.newArray = res;
// 			const mensaje = this.newArray[0].ErrMensaje;
// 			if (mensaje != '') {
// 				this.showModal(mensaje);
// 			}
// 			else {
// 				this.DEmpleados = this.newArray;
// 			};
// 		},
// 			(err => {
// 				this.showModal(err.message);
// 			})
// 		);
// 	}

// 	getSecciones() {
// 		const prm = { FILTRO: 'ACTIVAS' };
// 		this.sData.itemSecciones('qsecciones', prm).subscribe((data: any) => {

// 			const res = JSON.parse(data.data);
//       if ( (data.token != undefined) ){
//         const refreshToken = data.token;
//         localStorage.setItem("token", refreshToken);
//       }
// 			this.arraySeccion = res;
// 			const mensaje = this.arraySeccion[0].ErrMensaje;
// 			if (mensaje != '') {
// 				this.showModal(mensaje);
// 			}
// 			else {
// 				this.DSeccion = this.arraySeccion;
// 			};
// 		},
// 			(err => {
// 				this.showModal(err.message);
// 			})
// 		);
// 	}

// 	getInfoEmpleados() {
// 		const prm = { DATOS: '' };
// 		this.loadingVisible = true;
// 		this.sData.itemDetalle('consulta', prm).subscribe((data: any) => {

// 			const res = JSON.parse(data.data);
//       if ( (data.token != undefined) ){
//         const refreshToken = data.token;
//         localStorage.setItem("token", refreshToken);
//       }
// 			this.arrayEmpleados = res;
// 			const mensaje = this.arrayEmpleados[0].ErrMensaje;
// 			if (mensaje != '') {
// 				if( mensaje != 'No hay registros en la base de datos para Empleados Secciones')
// 					this.showModal(mensaje);
// 			}
// 			else {
// 				this.DGEmpleados = this.arrayEmpleados;
// 				if (this.DGEmpleados.length > 0){
// 					for (let i = 0; i < this.DGEmpleados.length; i++) {
// 						const item = this.DGEmpleados.reduce((ant, act)=>{return (ant.ITEM > act.ITEM) ? ant : act})
// 						this.DGEmpleados[i].ITEM = i + 1;
// 					}
// 				}
// 				this.consultaSeccionesEmpleado();
// 			};
// 		}, (err => {
// 			this.showModal(err.message);
// 		})
// 		);
// 		this.loadingVisible = false;
		
// 	}

// 	consultaSeccionesEmpleado() {
// 		const prm: any = [];
// 		for (let i = 0; i < this.DGEmpleados.length; i++) {
// 			prm.push({ ID_EMPLEADO: this.DGEmpleados[i].ID_EMPLEADO });
// 		}
				
// 		this.esEdicion = this.datosServiceDetail.esEdicion;
		
// 		this.sData.itemDetalle('empleados_secciones', prm).subscribe((data: any) => {
// 			const res = JSON.parse(data.data);
// 			if ( (data.token != undefined) ){
// 				const refreshToken = data.token;
// 				localStorage.setItem("token", refreshToken);
// 			}
// 			this.newArray = res;
// 			const mensaje = this.newArray[0].ErrMensaje;
// 			if (mensaje != '') {
// 				return
// 			}
// 			else {
// 				this.DGDetalle = this.newArray;
// 			};
// 		},
// 			(err => {
// 				this.showModal(err.message);
// 			})
// 		);
// 	}

// 	selectionGrid(e) {
//     this.filasSelecc = e.selectedRowKeys;
// 		const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === e.selectedRowKeys[0]) );
// 		this.DSeccionesEmpleado = seccemp;
//     if (this.filasSelecc.length != 0)
//       this.rowDelete = true;
//     else
//       this.rowDelete = false;
// 		//var rowIndex = e.component.getRowIndexByKey(e.selectedRowKeys[0]);
// 		e.component.expandRow(e.selectedRowKeys[0]);
// 		e.selectedRowsData[0].verZoom = !e.selectedRowsDat[0].verZoom;
//   }
	
// 	// Operaciones de grid
//   operGrid(e, operacion) {
//     switch (operacion) {
//       case 'delete':
//         // Elimina filas seleccionadas
//         Swal.fire({
//           title: '',
//           text: 'Desea eliminar los items seleccionados?',
//           icon: 'warning',
//           showCancelButton: true,
// 					confirmButtonColor: '#DF3E3E',
// 					cancelButtonColor: '#438ef1',
//           cancelButtonText: 'No',
//           confirmButtonText: 'Sí, eliminar'
//         }).then((result) => {
//           if (result.isConfirmed) {
//             this.filasSelecc.forEach((key) => {
//               const index = this.DGEmpleados.findIndex(a => a.ID_EMPLEADO === key);
// 							this.eliminarDatos(this.DGEmpleados[index]);
//               this.DGEmpleados.splice(index, 1);
//             });
//             this.gridEmpleados.instance.refresh();
// 						this.conCambios++;
//           }
//         });
//         break;

//       default:
//         break;
//     }
//   }

// 	onRowExpanding(e:any) {
// 		const seccemp = this.DGDetalle.filter(d => (d.ID_EMPLEADO === e.key) );
// 		this.DSeccionesEmpleado = seccemp;
// 	};

// 	// Imprimir reporte de aplicación
//   imprimirReporte(id_reporte, archivo, datosrpt) {
		
//     let filtroRep = {FILTRO: ''};
//     const prmLiq = {  clid: localStorage.getItem('empresa'), 
//                       usuario: localStorage.getItem('usuario'), 
//                       idrpt: archivo,
//                       id_reporte,
//                       aplicacion: this.prmUsrAplBarReg.aplicacion,
//                       tabla: this.prmUsrAplBarReg.tabla,
//                       filtro: filtroRep
//                     };

//     // Si no existe, no está abierta entonces agrega Tab
//     const listaTab = this.tabService.tabs.find(c => c.aplicacion === id_reporte);
//     if (listaTab === undefined) 
//       GlobalVariables.listaAplicaciones.unshift({ aplicacion: id_reporte, barra: undefined, statusEdicion: '' });

//     // Abre pestaña con nuevo reporte
//     this.tabService.addTab( new Tab(VisorrepComponent,    // visor
//                                     datosrpt.text,        // título
//                                     { parent: "PrincipalComponent", args: prmLiq }, // parámetro: reporte,filtro
//                                     id_reporte,           // código del reporte
//                                     'reporte',
//                                     true
//                           ));

// 	}

//   showModal(mensaje) {
// 		Swal.fire({
// 			iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
//      confirmButtonColor: '#0F4C81',
// 			title: '¡Error!',
// 			text: mensaje,
// 			allowOutsideClick: true,
// 			allowEscapeKey: false,
// 			allowEnterKey: false,
// 			backdrop: true,
// 			position: 'center',
// 			stopKeydownPropagation: false,
// 		});
// 	}


// }
