import type { XteinGridColumn, XteinRecordViewColumn } from '@xtein/ui';
import { RecordToolbarCapabilities } from '@xtein/sdk';
import { Com201ListaPrecios } from '../models/com-201-record.model';
import { Com201EditRule, Com201Lookup } from '../models/com-201-business.model';


/**
 * Option shown by the header selectors.
 */
export interface Com201Option<T = string> {
  text: string;
  value: T;
}

const options = <T>(values: readonly T[]): Com201Option<T>[] => values.map(value => ({ text: String(value), value }));


/** Header selector options (legacy COM201.component.ts:91-99). */
export const Com201StatusOptions = options(['ACTIVO', 'INACTIVO']);
export const Com201TypeOptions = options(['VENTAS', 'PROVEEDOR', 'COSTOS']);
export const Com201BasePriceOptions = options(['Ultima Compra', 'Ultimo Costo C/P', 'Precio Mercado', 'Kardex']);
export const Com201PriceApplicationOptions = options(['Producto', 'Atributo']);
export const Com201RoundingOptions = options([0, 1, 10, 100, 1000]);
export const Com201UpdateOptions = options(['Manual', 'Generada', 'Automática']);


/**
 * Empty record shown when no list is selected (legacy COM201.component.ts:225-241).
 */
export const Com201EmptyRecord: Readonly<Com201ListaPrecios> = {
  ID_LISTA: '',
  DESCRIPCION: '',
  TIPO: '',
  BASE_PRECIO: '',
  LISTA_BASE: '',
  ID_PROVEEDOR: '',
  APLICACION_PRECIO: '',
  MARGEN: 0,
  ACTUALIZACION: '',
  FECHA_INICIO: null,
  FECHA_FINAL: null,
  INCLUYE_IVA: false,
  ESTADO: '',
  PRINCIPAL: false,
  APROXIMACION: 1,
  NOMBRE_PROVEEDOR: ''
};


/**
 * Initial record for a new price list (legacy COM201.component.ts:826-842).
 * Dates are assigned with the current day when the record is created.
 */
export const Com201DefaultRecord: Readonly<Com201ListaPrecios> = {
  ...Com201EmptyRecord,
  TIPO: 'COSTOS',
  APLICACION_PRECIO: 'Producto',
  ACTUALIZACION: 'Generada',
  ESTADO: 'ACTIVO'
};


/**
 * Columns displayed in the quick view modal (legacy COM201.component.ts:1153).
 */
export const Com201RecordViewColumns: XteinRecordViewColumn[] = [
  { dataField: 'ID_LISTA', caption: 'Nombre' },
  { dataField: 'DESCRIPCION', caption: 'Descripción' },
  { dataField: 'TIPO', caption: 'Tipo' },
  { dataField: 'BASE_PRECIO', caption: 'Base precio' }
];


/**
 * Record-toolbar capabilities for COM-201.
 */
export const Com201ToolbarCapabilities: Readonly<RecordToolbarCapabilities> = {
  create: true,
  edit: true,
  delete: true,
  search: true,
  refresh: true,
  copy: true,
  view: true,
  sort: false,
  navigation: true,
  download: false,
  print: true,
  configure: true
};


/**
 * Item-editing rules by ACTUALIZACION (legacy COM201.component.ts:722-745 and 891-917).
 */
export const Com201EditRules: Readonly<Record<string, Com201EditRule>> = {
  Manual: { product: true, precioBase: false, precio: true, add: true, remove: true, select: true },
  Generada: { product: false, precioBase: true, precio: false, add: false, remove: true, select: true },
  'Automática': { product: false, precioBase: false, precio: false, add: false, remove: false, select: false }
};

/** Rule used when ACTUALIZACION has no value. */
export const Com201ReadOnlyRule: Readonly<Com201EditRule> = Com201EditRules['Automática'];


/**
 * Options of the Configurar popup (settings_aplicacion VALOR).
 */
export const Com201Setting = {
  GenerateGroup: 'Generar precio grupo',
  UpdatePrices: 'Actualizar Precios',
  UpdateMatrices: 'Actualizar Matrices'
} as const;


/** Root of the product-group tree (legacy COM201.component.html:280). */
export const Com201RootGroup = 'INVENTARIOS';


/** Request used to open the advanced matrix (legacy COM201.component.ts:584). */
export const Com201MatrixRequest = {
  applicationId: 'MA-019',
  title: 'Matriz Avanzada',
  parameters: { FILTRO: 'Actualizar por Lista de Precio' }
} as const;


/** Page sizes offered by the items paginator. */
export const Com201PageSizes: readonly number[] = [20, 50, 100, 200];
export const Com201DefaultPageSize = 50;


/** Number format of the price columns. */
export const Com201MoneyFormat = '#,##0.00';


/**
 * User messages.
 */
export const Com201Message = {
  missingCode: 'Debe asignar un Código de lista.',
  missingName: 'Debe asignar un Nombre de lista.',
  invalidDates: 'La fecha final no puede ser menor a la fecha inicial.',
  deleteConfirm: (id: string) => `¿Desea eliminar la lista de precios ${id}? Se eliminarán los ítems asignados.`,
  cancelDirty: '¿Desea cancelar sin guardar cambios?',
  cancelClean: '¿Desea cancelar la operación?',
  copyNotice: 'Para copiar este Registro recuerde: debe agregar un nuevo Código.',
  deleted: 'Lista de precios eliminada.',
  saved: 'Registro actualizado',
  notFound: 'No se encontraron registros.',
  modeNotAllowed: 'Esta operación no está permitida en modo consulta.',
  editModeRequired: 'Esta operación solo está disponible al crear, modificar o copiar una lista.',
  automaticNotAllowed: 'Esta operación no aplica a listas con actualización Automática.',
  groupRequired: 'Seleccione un grupo en el árbol de grupos.',
  generateConfirm: (group: string) => `Se reemplazarán los ítems del grupo ${group} y se quitarán los que el sistema no devuelva. ¿Continuar?`,
  updatePricesConfirm: 'Se recalcularán los precios de toda la lista y se quitarán los ítems que el sistema no devuelva. ¿Continuar?',
  merged: 'Precios generados. Guarde la lista para conservar los cambios.',
  matrixUnavailable: 'La Matriz Avanzada (MA-019) no está disponible o no tiene permiso.',
  matrixAlreadyOpen: "La Matriz Avanzada ya estaba abierta; aplique el filtro 'Actualizar por Lista de Precio' manualmente.",
  groupLocked: 'No se puede filtrar por grupo mientras haya una edición de precio.',
  listChanged: 'La lista cambió en el servidor; cancele y vuelva a editar.',
  itemIncomplete: 'Falta completar datos del producto: Producto, Precio, Atributo ó Unidad de Medida.',
  itemRepeated: 'Producto repetido, modifique la Unidad de Medida.',
  deleteItemsConfirm: (count: number) => `¿Desea eliminar los ${count} ítems seleccionados?`
} as const;


/** Columns of the product selector of the item editor. */
export const Com201ProductColumns: XteinGridColumn<Com201Lookup, unknown>[] = [
  { dataField: 'PRODUCTO', caption: 'Producto', width: 140 },
  { dataField: 'NOMBRE', caption: 'Nombre' }
];

/** Columns of the provider selector. */
export const Com201ProviderColumns: XteinGridColumn<Com201Lookup, unknown>[] = [
  { dataField: 'ID_PROVEEDOR', caption: 'Proveedor', width: 140 },
  { dataField: 'NOMBRE', caption: 'Nombre' }
];
