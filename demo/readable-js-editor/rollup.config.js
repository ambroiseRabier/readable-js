import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: "./editor.js",
  output: {
    file: "./public/editor.bundle.js",
    format: "iife"
  },
  plugins: [commonjs(), nodeResolve(
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


