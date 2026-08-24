import globals from 'globals';
import eslintJS from '@eslint/js';
import eslintTS from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import onlyWarn from 'eslint-plugin-only-warn';


/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		files: ["**/*.{js,ts}"],
		languageOptions: {
			...eslintTS.configs.recommended[0].languageOptions,
			...eslintTS.configs.stylistic[0].languageOptions,
			globals: globals.node,
			parser: eslintTS.parser,
			ecmaVersion: 2022,
			sourceType: "module",
		},
		plugins: {
			onlyWarn,
			...eslintTS.configs.recommended[0].plugins,
			...eslintTS.configs.stylistic[0].plugins,
			'@stylistic': stylistic
		},
		rules: {
			...eslintJS.configs.recommended.rules,
			...eslintTS.configs.recommended[1].rules,
			...eslintTS.configs.recommended[2].rules,
			...eslintTS.configs.stylistic[1].rules,
			...eslintTS.configs.stylistic[2].rules,
			'@stylistic/brace-style': ['error', 'stroustrup', { allowSingleLine: true }],
			'@stylistic/comma-dangle': ['error', 'never'],
			'@stylistic/comma-spacing': 'error',
			'@stylistic/function-call-spacing': ['error', 'never'],
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/key-spacing': 'error',
			'@stylistic/lines-around-comment': 'error',
			'@stylistic/member-delimiter-style': ['error', {
				multiline: {
					delimiter: 'semi',
					requireLast: true
				},
				singleline: {
					delimiter: 'semi',
					requireLast: true
				},
				multilineDetection: 'brackets'
			}],
			'@stylistic/no-extra-parens': 'error',
			'@stylistic/no-extra-semi': 'error',
			'@stylistic/object-curly-newline': 'error',
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true } ],
			'@stylistic/padding-line-between-statements': 'error',
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/quote-props': ['error', 'as-needed'],
			'@stylistic/jsx-quotes': ["error", "prefer-single"],
			'@stylistic/semi': 'error',
			'@stylistic/semi-spacing': 'error',
			'@stylistic/space-before-blocks': 'error',
			'@stylistic/space-before-function-paren': ['off'],
			'@stylistic/space-infix-ops': 'error',
			'@stylistic/type-annotation-spacing': 'error',
			'@stylistic/eol-last': ["error", "always"]
		}
	},
	{
		ignores: ['node_modules/**', '.output/**']
	}
];