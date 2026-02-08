
export const APP_CONFIG = {
  name: 'FS PDF Maker',
  version: '1.0.0',
  export: {
    timeout: 60000, // 60 seconds
    maxRetries: 2,
    defaultUrl: 'https://super-duper-spoon-production-b6e8.up.railway.app'
  },
  validation: {
    minQuestionLength: 3,
    minOptionLength: 1
  },
  storage: {
    dbName: 'FSPDFMakerDB',
    version: 1
  }
};

export const FEATURE_FLAGS = {
  enablePwaInstall: true,
  enableStrictValidation: true,
  enableAnalytics: false // Placeholder for E3
};
