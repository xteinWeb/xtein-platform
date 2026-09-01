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
     * Angular and the other platform dependencies must use
     * the same runtime instances across the Shell and the
     * loaded microfrontends.
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
     * Sharing these mappings is especially important for
     * runtime services such as ToolbarRuntimeService and
     * Workspace-related platform contracts.
     */
    sharedMappings: [

      '@xtein/api-client',

      '@xtein/runtime',

      '@xtein/sdk',

      '@xtein/session',

      '@xtein/ui'
    ],


    /**
     * Packages that are not required by the browser runtime.
     */
    skip: [

      'rxjs/ajax',

      'rxjs/fetch',

      'rxjs/testing',

      'rxjs/webSocket'
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
       * same XTEIN library instance between Shell and remotes.
       */
      mappingVersion:
        true
    }
  });