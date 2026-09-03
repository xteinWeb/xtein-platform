const {
  withNativeFederation,
  shareAll
} = require(
  '@angular-architects/native-federation/config'
);


module.exports =
  withNativeFederation({

    /**
     * Native Federation identifier of the XTEIN Shell.
     */
    name:
      'shell',


    /**
     * Shared npm dependencies.
     *
     * Angular, RxJS and the other platform dependencies must use
     * the same runtime instances across the Shell and the loaded
     * microfrontends.
     *
     * DevExtreme and DevExpress packages are excluded below because
     * they use secondary and deep package entry points that must
     * remain bundled locally instead of being resolved through the
     * Native Federation import map.
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
     * XTEIN workspace libraries that must be shared between
     * the Shell and the microfrontends.
     *
     * Runtime-oriented libraries must use the same instance so
     * application state, toolbar commands, session state and
     * Dashboard runtime configuration remain synchronized between
     * the Shell and the loaded microfrontends.
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
     * RxJS secondary entry points listed here are not required by
     * the XTEIN browser runtime.
     *
     * DevExtreme and DevExpress packages must not be shared through
     * Native Federation because their internal dependency graph uses
     * secondary and deep imports such as:
     *
     * devextreme/common/core/events/utils
     * devextreme/core/dom_adapter
     * devextreme-angular/ui/...
     * devexpress-dashboard-angular/...
     *
     * These dependencies remain bundled locally by the consuming
     * application/library.
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
       * actually used by the Shell.
       */
      ignoreUnusedDeps:
        true,


      /**
       * Adds versions to shared workspace mappings.
       *
       * This allows the Native Federation runtime to reuse the
       * same XTEIN library instance between the Shell and remotes.
       */
      mappingVersion:
        true
    }
  });