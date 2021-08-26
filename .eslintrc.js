module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2021': true,
    'node': {
      'Buffer': true
    }
  },
  'ignorePatterns': [
    'src/public/*',
    'test/*'
  ],
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended'
  ],
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module'
  },
  'settings': {
    'react': {
      'version': 'detect'
    }
  },
  'globals': {
    '__dirname': 'readonly',

    'it': 'readonly',
    'describe': 'readonly',
    'beforeEach': 'readonly',
    'afterEach': 'readonly',
  },
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ]
  }
};
