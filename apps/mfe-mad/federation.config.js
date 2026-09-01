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
     * Public entry point consumed dynamically by the
     * XTEIN Shell.
     */
    exposes: {

      './ApplicationHost':
        './apps/mfe-mad/src/app/application-host/application-host.component.ts'
    },


    /**
     * Shared npm dependencies.
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
     * Shared XTEIN workspace libraries.
     *
     * These mappings must resolve to the same runtime instances
     * used by the Shell.
     */
    sharedMappings: [

      '@xtein/api-client',

      '@xtein/runtime',

      '@xtein/sdk',

      '@xtein/session',

      '@xtein/ui'
    ],


    skip: [

      'rxjs/ajax',

      'rxjs/fetch',

      'rxjs/testing',

      'rxjs/webSocket'
    ],


    features: {

      ignoreUnusedDeps:
        true,

      mappingVersion:
        true
    }
  });