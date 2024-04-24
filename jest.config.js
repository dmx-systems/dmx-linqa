module.exports = {
  modulePaths: ['src/main/js'],
  moduleFileExtensions: ['js', 'vue'],
  moduleNameMapper: {
      '\\.(css|less|svg)$': '<rootDir>/src/test/js/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!(dmx-api)/)'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.vue$': '@vue/vue2-jest'
  }
}
