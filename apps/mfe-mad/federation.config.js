const {
  withNativeFederation,
  shareAll
} = require(
  '@angular-architects/native-federation/config'
);

module.exports =
  withNativeFederation({

    name: 'mfe-mad',

    exposes: {

      './ApplicationHost':
        './apps/mfe-mad/src/app/application-host/application-host.component.ts'

    },

    shared: {

      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: 'auto'
      })

    },

    skip: [
      'rxjs/ajax',
      'rxjs/fetch',
      'rxjs/testing',
      'rxjs/webSocket'
    ],

    features: {
      ignoreUnusedDeps: true
    }

  });