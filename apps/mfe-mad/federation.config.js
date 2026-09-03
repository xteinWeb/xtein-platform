const {
  withNativeFederation,
  shareAll
} = require(
  '@angular-architects/native-federation/config'
);


/**
 * Native Federation configuration for the MAD microfrontend.
 *
 * The MAD microfrontend contains multiple XTEIN applications
 * resolved dynamically through MadApplicationRegistry.
 */
module.exports =
  withNativeFederation({

    /**
     * Native Federation identifier.
     */
    name:
      'mfe-mad',


    /**
     * Entry point consumed by the XTEIN Shell.
     */
    exposes: {

      './ApplicationHost':
        './apps/mfe-mad/src/app/application-host/application-host.component.ts'
    },


    /**
     * Shared npm dependencies.
     *
     * Only dependencies effectively used by the microfrontend
     * are included because ignoreUnusedDeps is enabled below.
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
     * XTEIN workspace libraries that must use the same runtime
     * instances in the Shell and the MAD microfrontend.
     */
    sharedMappings: [

      '@xtein/api-client',

      '@xtein/runtime',

      '@xtein/sdk',

      '@xtein/session',

      '@xtein/ui'
    ],


    /**
     * RxJS entry points not required by the browser runtime.
     */
    skip: [

      'rxjs/ajax',

      'rxjs/fetch',

      'rxjs/testing',

      'rxjs/webSocket'
    ],


    features: {

      /**
       * Keeps Native Federation from attempting to bundle every
       * dependency declared in the workspace package.json.
       *
       * XTEIN shared mappings are explicitly made visible to the
       * dependency analyzer from bootstrap.ts.
       */
      ignoreUnusedDeps:
        true,


      /**
       * Publishes version information for workspace mappings.
       */
      mappingVersion:
        true
    }
  });