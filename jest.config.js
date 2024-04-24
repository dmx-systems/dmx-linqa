module.exports = {
  modulePaths: ['src/main/js'],
  moduleFileExtensions: ['js', 'vue'],
  moduleNameMapper: {
      '\\.(css|less|svg)$': '<rootDir>/src/test/js/fileMock.js',
    },
  transformIgnorePatterns: ['/node_modules/(?!(dmx-api)/)'],
  transform: {
      '\\.[jt]sx?$': 'babel-jest',
      '.*\\.(vue)$': 'vue-jest'
   }
}
