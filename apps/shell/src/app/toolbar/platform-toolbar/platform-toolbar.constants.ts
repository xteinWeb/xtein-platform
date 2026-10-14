import {
  RecordToolbarMode,
  ToolbarAction
} from '@xtein/sdk';

export interface PlatformToolbarTooltipInfo {
  readonly title: string;
  readonly info: string;
}


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

export const PlatformToolbarTooltips: Readonly<Record<string, PlatformToolbarTooltipInfo>> = {
  [ToolbarAction.New]: {
    title: 'Nuevo registro',
    info: 'Adiciona nuevo registro'
  },
  [ToolbarAction.Edit]: {
    title: 'Modifica registro',
    info: 'Modifica registro previamente consultado'
  },
  [ToolbarAction.Copy]: {
    title: 'Copiar registro',
    info: 'Copiar datos del registro actual para generar un nuevo registro'
  },
  [ToolbarAction.Delete]: {
    title: 'Elimina registro',
    info: 'Elimina registro actual. Aplican validaciones'
  },
  [ToolbarAction.Save]: {
    title: 'Guardar registro',
    info: 'Guarda cambios. Aplican validaciones'
  },
  [ToolbarAction.Cancel]: {
    title: 'Cancela edición',
    info: 'Cancela cualquier cambio de registro y devuelve el control a la acción anterior'
  },
  [ToolbarAction.Search]: {
    title: 'Prepara consulta',
    info: 'Solicita datos a consultar'
  },
  [ToolbarAction.Sort]: {
    title: 'Ordenar datos',
    info: 'Aplica ordenamiento de datos por un campo específico'
  },
  [ToolbarAction.View]: {
    title: 'Vista preliminar',
    info: 'Vista general de datos consultados'
  },
  [ToolbarAction.First]: {
    title: 'Ir al primer registro',
    info: 'Posiciona la consulta en el primer registro'
  },
  [ToolbarAction.Previous]: {
    title: 'Anterior registro',
    info: 'Posiciona la consulta en el anterior registro'
  },
  [ToolbarAction.Next]: {
    title: 'Siguiente registro',
    info: 'Posiciona la consulta en el siguiente registro'
  },
  [ToolbarAction.Last]: {
    title: 'Último registro',
    info: 'Posiciona la consulta en el último registro'
  },
  [ToolbarAction.Download]: {
    title: 'Descargar datos',
    info: 'Descargar datos de la consulta o del registro actual'
  },
  [ToolbarAction.Print]: {
    title: 'Generación de informes',
    info: 'Seleccionar informe a generar del registro actual o de todos los consultados'
  },
  [ToolbarAction.Refresh]: {
    title: 'Refrescar datos',
    info: 'Recarga de datos asociados a los distintos objetos de la forma'
  },
  [ToolbarAction.Configure]: {
    title: 'Configuraciones de aplicación',
    info: 'Personaliza la aplicación'
  },
  overflow: {
    title: 'Más opciones',
    info: 'Muestra opciones adicionales de la barra de registro'
  },
  positionCurrent: {
    title: 'Ir a un registro',
    info: 'Ir a un numero de registro de la presente consulta'
  },
  positionTotal: {
    title: 'Número total de registros',
    info: 'Número total de registros consultados'
  },
  [RecordToolbarMode.Creating]: {
    title: 'Nuevo registro [EDICIÓN]',
    info: 'Está en modo adición de registro'
  },
  [RecordToolbarMode.Editing]: {
    title: 'Modificar registro [EDICIÓN]',
    info: 'Está en modo modificación de registro'
  },
  [RecordToolbarMode.Copying]: {
    title: 'Copiar registro [EDICIÓN]',
    info: 'Está en modo copia de registro'
  }
};