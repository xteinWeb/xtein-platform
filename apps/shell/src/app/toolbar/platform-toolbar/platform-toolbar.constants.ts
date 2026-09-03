import {
  ToolbarAction
} from '@xtein/sdk';


export const PlatformToolbarGroup = {

  Record:
    'record',

  Edition:
    'edition',

  Query:
    'query',

  Navigation:
    'navigation',

  Output:
    'output',

  System:
    'system'

} as const;


export type PlatformToolbarGroup =
  typeof PlatformToolbarGroup[
    keyof typeof PlatformToolbarGroup
  ];


/**
 * Defines the responsive importance of one toolbar action.
 */
export const PlatformToolbarResponsivePriority = {

  Essential:
    1,

  Standard:
    2,

  Extended:
    3

} as const;


export type PlatformToolbarResponsivePriority =
  typeof PlatformToolbarResponsivePriority[
    keyof typeof PlatformToolbarResponsivePriority
  ];


export interface PlatformToolbarItem {

  action:
    ToolbarAction;

  label:
    string;

  iconClass:
    string;

  group:
    PlatformToolbarGroup;

  responsivePriority:
    PlatformToolbarResponsivePriority;
}


export const PlatformToolbarItems:
  readonly PlatformToolbarItem[] = [

    {
      action: ToolbarAction.New,
      label: 'Nuevo',
      iconClass: 'icon-crear-ol',
      group: PlatformToolbarGroup.Record,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Edit,
      label: 'Modificar',
      iconClass: 'icon-editar-ol',
      group: PlatformToolbarGroup.Record,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Copy,
      label: 'Copiar',
      iconClass: 'icon-copiar',
      group: PlatformToolbarGroup.Record,
      responsivePriority: PlatformToolbarResponsivePriority.Standard
    },

    {
      action: ToolbarAction.Delete,
      label: 'Eliminar',
      iconClass: 'icon-eliminar-ol',
      group: PlatformToolbarGroup.Record,
      responsivePriority: PlatformToolbarResponsivePriority.Standard
    },

    {
      action: ToolbarAction.Save,
      label: 'Guardar',
      iconClass: 'icon-aceptar-ol',
      group: PlatformToolbarGroup.Edition,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Cancel,
      label: 'Cancelar',
      iconClass: 'icon-cancelar-ol',
      group: PlatformToolbarGroup.Edition,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Search,
      label: 'Buscar',
      iconClass: 'icon-buscar-documentos-ol',
      group: PlatformToolbarGroup.Query,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Sort,
      label: 'Ordenar',
      iconClass: 'icon-ordenar',
      group: PlatformToolbarGroup.Query,
      responsivePriority: PlatformToolbarResponsivePriority.Extended
    },

    {
      action: ToolbarAction.View,
      label: 'Vista rápida',
      iconClass: 'icon-ver-ol',
      group: PlatformToolbarGroup.Query,
      responsivePriority: PlatformToolbarResponsivePriority.Standard
    },

    {
      action: ToolbarAction.First,
      label: 'Primero',
      iconClass: 'icon-primero',
      group: PlatformToolbarGroup.Navigation,
      responsivePriority: PlatformToolbarResponsivePriority.Standard
    },

    {
      action: ToolbarAction.Previous,
      label: 'Anterior',
      iconClass: 'icon-anterior',
      group: PlatformToolbarGroup.Navigation,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Next,
      label: 'Siguiente',
      iconClass: 'icon-siguiente',
      group: PlatformToolbarGroup.Navigation,
      responsivePriority: PlatformToolbarResponsivePriority.Essential
    },

    {
      action: ToolbarAction.Last,
      label: 'Último',
      iconClass: 'icon-ultimo',
      group: PlatformToolbarGroup.Navigation,
      responsivePriority: PlatformToolbarResponsivePriority.Standard
    },

    {
      action: ToolbarAction.Download,
      label: 'Descargar',
      iconClass: 'icon-descargar-ol',
      group: PlatformToolbarGroup.Output,
      responsivePriority: PlatformToolbarResponsivePriority.Extended
    },

    {
      action: ToolbarAction.Print,
      label: 'Imprimir',
      iconClass: 'icon-imprimir-ol',
      group: PlatformToolbarGroup.Output,
      responsivePriority: PlatformToolbarResponsivePriority.Extended
    },

    {
      action: ToolbarAction.Refresh,
      label: 'Refrescar',
      iconClass: 'icon-refrescar',
      group: PlatformToolbarGroup.System,
      responsivePriority: PlatformToolbarResponsivePriority.Extended
    },

    {
      action: ToolbarAction.Configure,
      label: 'Configurar',
      iconClass: 'icon-configurar-ol',
      group: PlatformToolbarGroup.System,
      responsivePriority: PlatformToolbarResponsivePriority.Extended
    }
  ];