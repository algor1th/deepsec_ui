const common = {
  appName: 'Deepsec UI',
  env: process.env.NODE_ENV || 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  appRoot: __dirname // Does not work if packaged
}

const dev = {
  logLevelConsole: 'silly',
  logLevelFile: 'silly',
  devTools: {
    startUp: true,
    menu: true
  },
  mockDataAsDefault: true
}

const prod = {
  logLevelConsole: 'warn',
  logLevelFile: 'info',
  devTools: {
    startUp: false,
    menu: true // TODO turn to false
  },
  mockDataAsDefault: true // TODO turn to false
}

// Export "common" union ("prod" or "dev")
// If same field then common will be override
export default (common.env === 'production' ? { ...common, ...prod } : { ...common, ...dev })
