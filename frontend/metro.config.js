const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

const config = {
  resolver: {
    extraNodeModules: {
      invariant: path.resolve(__dirname, 'node_modules/invariant/invariant.js'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
