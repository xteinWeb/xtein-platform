const {
  withNativeFederation,
  shareAll
} = require(
  '@angular-architects/native-federation/config'
);


module.exports =
  withNativeFederation({

    /**
     * Native Federation identifier of the MAD microfrontend.
     */
    name:
      'mfe-mad',


    /**
     * Components exposed by the MAD microfrontend.
     *
     * The Shell loads ApplicationHost and passes the requested
     * XTEIN application identifier so the MAD registry can resolve
     * the corresponding functional application dynamically.
     */
    exposes: {

      './ApplicationHost':
        './apps/mfe-mad/src/app/application-host/application-host.component.ts'
    },


    /**
     * Shared npm dependencies.
     *
     * Angular, RxJS and the shared XTEIN platform libraries must use
     * compatible singleton runtime instances across the Shell and
     * the loaded microfrontend.
     *
     * DevExtreme and DevExpress packages are excluded below because
     * they make extensive use of secondary and deep entry points that
     * should remain bundled locally rather than being resolved through
     * the Native Federation import map.
     */
    shared: {

      ...shareAll({

        singleton:
          true,

        strictVersion:
          true,

        requiredVersion:
          'auto'
      })
    },


    /**
     * XTEIN workspace libraries that must be shared with the Shell.
     *
     * Sharing these mappings is required so stateful singleton
     * services such as ToolbarRuntimeService,
     * WorkspaceRuntimeService, SessionService and
     * XteinDashboardRuntimeService use the same runtime instance.
     */
    sharedMappings: [

      '@xtein/api-client',

      '@xtein/dashboard-runtime',

      '@xtein/runtime',

      '@xtein/sdk',

      '@xtein/session',

      '@xtein/ui'
    ],


    /**
     * Packages excluded from Native Federation sharing.
     *
     * DevExtreme and DevExpress dependencies use secondary and deep
     * imports such as:
     *
     * devextreme/common/core/events/utils
     * devextreme/core/dom_adapter
     * devextreme-angular/ui/...
     * devexpress-dashboard-angular/...
     *
     * These packages remain bundled locally by the MAD
     * microfrontend and the libraries it consumes.
     */
    skip: [

      'rxjs/ajax',

      'rxjs/fetch',

      'rxjs/testing',

      'rxjs/webSocket',


      /^devextreme($|\/)/,

      /^devextreme-angular($|\/)/,

      /^devexpress-/,

      /^@devexpress\//
    ],


    features: {

      /**
       * Generates federation bundles only for dependencies
       * actually used by the MAD microfrontend.
       */
      ignoreUnusedDeps:
        true,


      /**
       * Adds version metadata to mapped workspace libraries so
       * the Shell and the MAD microfrontend can reuse the same
       * XTEIN singleton instances.
       */
      mappingVersion:
        true
    }
  });