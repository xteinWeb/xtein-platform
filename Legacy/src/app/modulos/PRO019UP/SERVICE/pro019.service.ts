import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PRO019DataService {

	// Objetos públicos de intercambio de datos
  public D_MATRIZ: any = [];
  public D_MATRIZ_SIMPLE: any = [];
  public DPartes: any = [];
  public DESCRIPCION_RUTA: string = '';
  public SECCIONES_RUTA_SELECCIONADA: any = [];
  public DGSECCIONES_MATERIALES: any = [];
  public DGMaterialesConsolidado: any = [];
  public DGSECCIONES_MANO_OBRA: any = [];
  public DGManoObraConsolidado: any = [];
	public MATRIZ_DETALLE_MATERIALES: any = [];
	public MATRIZ_DETALLE_MANO_OBRA: any = [];
	public MATRIZ_DETALLE_CIF: any = [];
	public MATRIZ_CIF: any = [];
	public DGMateriales: any = [];
	public DGManoObra: any = [];

	// TOTALES
	public TOTAL_MATERIALES: number = 0;
	public SUBTOTAL_MA: number = 0;
	public TOTAL_GRAVADOS: number = 0;
	public TOTAL_SIN_IVA: number = 0;
	public TOTAL_MANO_OBRA: number = 0;
  public PROTECCION_MA: number = 0;
  public SUBTOTAL_MO: number = 0;
  public PROTECCION_MO: number = 0;
	public TOTAL_COSTO_DIRECTO: number = 0;
	public TOTAL_CIF: number = 0;
  public TOTAL_CIF_FIJO: number = 0;
  public TOTAL_CIF_VARIABLE: number = 0;
	public TOTAL_COSTO: number = 0;
	public TOTAL_UTILIDAD: number = 0;
	public PRECIO_BASE: number = 0;
	public CON_OPERATIVA: number = 0;
	public TOTAL_PAG: number = 0;
	public TOTAL_GRAVAMENES: number = 0;
	public TOTAL_PDG: number = 0;
	public VARIACION: number = 0;
	public TOTAL_AJUSTE_PRECIO: number = 0;
	public TOTAL_MATRIZ: number = 0;
	public TOTALES: number = 0;
	public conCambios: number = 0;

	// Modos de operación
  public accion: any;
	public readonly: any;
	public modoGrid: any;
	private subjectRefresh = new Subject<any>();
	private subjectReadOnly = new Subject<any>();
	private subjectConCambios = new Subject<any>();
	private subjectModoGrid = new Subject<any>();

  // Observers para los componentes
		//PRINCIPAL A MATERTIALES
  	private subjectDataSeccionesMateriales = new Subject<any>();
		//PRINCIPAL A MANO OBRA
  	private subjectDataSeccionesManoObra = new Subject<any>();
		//PRINCIPAL A CIF
  	private subjectDataTiposCif = new Subject<any>();		
  	private subjectTotalTCDCIF = new Subject<any>();		
		
  	private subjectTotales = new Subject<any>();
  	private subjectCalcularTotales = new Subject<any>();

  constructor() { }

	// Comunicación Principal-Hijos
	setRefresh(prmDatos: any) {
		this.subjectRefresh.next(prmDatos);
	}
	getRefresh(): Observable<any> {
		return this.subjectRefresh.asObservable();
	}

	setReadOnly(prmDatos: any) {
		this.subjectReadOnly.next(prmDatos);
	}
	getReadOnly(): Observable<any> {
		return this.subjectReadOnly.asObservable();
	}

	setConCambios(prmDatos: any) {
		this.subjectConCambios.next(prmDatos);
	}
	getConCambios(): Observable<any> {
		return this.subjectConCambios.asObservable();
	}

	setModoGrid(prmDatos: any) {
		this.subjectModoGrid.next(prmDatos);
	}
	getModoGrid(): Observable<any> {
		return this.subjectModoGrid.asObservable();
	}

	// Comunicación Principal-Materiales
	setDataSeccionesMateriales(prmDatos: any) {
		this.subjectDataSeccionesMateriales.next(prmDatos);
	}

	getDataSeccionesMateriales(): Observable<any> {
		return this.subjectDataSeccionesMateriales.asObservable();
	}

	// Comunicación Principal-Mano de obra
	setDataSeccionesManoObra(prmDatos: any) {
		this.subjectDataSeccionesManoObra.next(prmDatos);
	}

	getDataSeccionesManoObra(): Observable<any> {
		return this.subjectDataSeccionesManoObra.asObservable();
	}

	// Comunicación Principal-CIF
	setDataTiposCif(prmDatos: any) {
		this.subjectDataTiposCif.next(prmDatos);
	}

	getDataTiposCif(): Observable<any> {
		return this.subjectDataTiposCif.asObservable();
	}
	
	setTotalTCDCIF(prmDatos: any) {
		this.subjectTotalTCDCIF.next(prmDatos);
	}

	getTotalTCDCIF(): Observable<any> {
		return this.subjectTotalTCDCIF.asObservable();
	}

	// Comunicación Principal-Totales
	setTotales(prmDatos: any) {
		this.subjectTotales.next(prmDatos);
	}

	getTotales(): Observable<any> {
		return this.subjectTotales.asObservable();
	}

	setCalcularTotales(prmDatos: any) {
		this.subjectCalcularTotales.next(prmDatos);
	}

	getCalcularTotales(): Observable<any> {
		return this.subjectCalcularTotales.asObservable();
	}


}
