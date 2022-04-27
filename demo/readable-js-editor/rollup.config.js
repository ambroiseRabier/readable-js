import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs'; // needed for esprima
import json from '@rollup/plugin-json'; // needed for escodegen
import typescript from '@rollup/plugin-typescript'; // needed for escodegen

export default {
  input: "./editor.ts",
  output: {
    file: "./public/editor.bundle.js",
    format: "iife"
  },
  plugins: [json(), typescript({
    compilerOptions: {
      module: "esnext",
      target: "es2017"
    }
  }), commonjs(), nodeResolve(
    {
  // moduleDirectories: [
  //   'nodes_modules',
    // 'readable-js',
    // '../readable-js',
    // '..',
    // path.join(process.cwd(), '..'),
    // path.join(process.cwd(), '..', 'readable-js'),
    // path.join(process.cwd(), '..', '..', 'packages'),
  // ],
  //   rootDir: path.join(process.cwd(), '..') // , '..'
  }
  )],
}


