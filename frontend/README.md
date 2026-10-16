# React + Vite

This is a minimal template to get React working with vite, using HMR and some of the ESLint rules.

There are currently two official plugins:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

This template is disabled as it affects dev & build performances, thus the React Compiler is not enabled. It can be added by following this documentation: https://react.dev/learn/react-compiler/installation

You can expand the configuration by adding a second file to the fileNames array, like this:

For production applications we suggest working with TypeScript, and lint rules that are aware of types. See the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) on how to add TypeScript and [typescript-eslint](https://typescript-eslint.io) to your project.