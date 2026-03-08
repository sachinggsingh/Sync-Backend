import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        files: ["**/*.js", "**/*.mjs"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                node: true,
                process: true,
                __dirname: true,
                module: true,
                require: true,
                console: true,
                jest: true,
                describe: true,
                it: true,
                expect: true,
                beforeAll: true,
                afterAll: true,
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
        },
    },
];
