import {
  ToolbarAction
} from '@xtein/sdk';


/**
 * Defines the visual groups used by the XTEIN platform toolbar.
 *
 * Groups belong exclusively to the Shell presentation layer.
 */
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


/**
 * Represents a valid platform toolbar visual group.
 */
export type PlatformToolbarGroup =
  typeof PlatformToolbarGroup[
    keyof typeof PlatformToolbarGroup
  ];


/**
 * Defines one action displayed by the XTEIN platform toolbar.
 */
export interface PlatformToolbarItem {

  /**
   * Platform action represented by the toolbar button.
   */
  action:
    ToolbarAction;

  /**
   * User-facing description.
   */
  label:
    string;

  /**
   * XTEIN icon-font class.
   */
  iconClass:
    string;

  /**
   * Visual toolbar group.
   */
  group:
    PlatformToolbarGroup;
}


/**
 * Defines the standard presentation and order of the
 * XTEIN platform toolbar.
 *
 * Visibility and enabled state do not live here.
 * Those values come dynamically from ToolbarState.
 */
export const PlatformToolbarItems:
  readonly PlatformToolbarItem[] = [

    {
      action:
        ToolbarAction.New,

      label:
        'Nuevo',

      iconClass:
        'icon-crear-ol',

      group:
        PlatformToolbarGroup.Record
    },

    {
      action:
        ToolbarAction.Edit,

      label:
        'Modificar',

      iconClass:
        'icon-editar-ol',

      group:
        PlatformToolbarGroup.Record
    },

    {
      action:
        ToolbarAction.Copy,

      label:
        'Copiar',

      iconClass:
        'icon-copiar',

      group:
        PlatformToolbarGroup.Record
    },

    {
      action:
        ToolbarAction.Delete,

      label:
        'Eliminar',

      iconClass:
        'icon-eliminar-ol',

      group:
        PlatformToolbarGroup.Record
    },

    {
      action:
        ToolbarAction.Save,

      label:
        'Guardar',

      iconClass:
        'icon-aceptar-ol',

      group:
        PlatformToolbarGroup.Edition
    },

    {
      action:
        ToolbarAction.Cancel,

      label:
        'Cancelar',

      iconClass:
        'icon-cancelar-ol',

      group:
        PlatformToolbarGroup.Edition
    },

    {
      action:
        ToolbarAction.Search,

      label:
        'Buscar',

      iconClass:
        'icon-buscar-documentos-ol',

      group:
        PlatformToolbarGroup.Query
    },

    {
      action:
        ToolbarAction.View,

      label:
        'Vista',

      iconClass:
        'icon-ver-ol',

      group:
        PlatformToolbarGroup.Query
    },

    {
      action:
        ToolbarAction.First,

      label:
        'Primero',

      iconClass:
        'icon-primero',

      group:
        PlatformToolbarGroup.Navigation
    },

    {
      action:
        ToolbarAction.Previous,

      label:
        'Anterior',

      iconClass:
        'icon-anterior',

      group:
        PlatformToolbarGroup.Navigation
    },

    {
      action:
        ToolbarAction.Next,

      label:
        'Siguiente',

      iconClass:
        'icon-siguiente',

      group:
        PlatformToolbarGroup.Navigation
    },

    {
      action:
        ToolbarAction.Last,

      label:
        'Último',

      iconClass:
        'icon-ultimo',

      group:
        PlatformToolbarGroup.Navigation
    },

    {
      action:
        ToolbarAction.Print,

      label:
        'Imprimir',

      iconClass:
        'icon-imprimir-ol',

      group:
        PlatformToolbarGroup.Output
    },

    {
      action:
        ToolbarAction.Refresh,

      label:
        'Refrescar',

      iconClass:
        'icon-refrescar',

      group:
        PlatformToolbarGroup.System
    },

    {
      action:
        ToolbarAction.Configure,

      label:
        'Configurar',

      iconClass:
        'icon-configurar-ol',

      group:
        PlatformToolbarGroup.System
    }

  ];