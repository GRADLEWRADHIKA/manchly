module.exports = {
  assets: ['./assets/fonts'],
  dependencies: {
    // OTA updates are Android-only; keep Hot Updater's native module out of the iOS build.
    '@hot-updater/react-native': {
      platforms: {
        ios: null,
      },
    },
  },
};
