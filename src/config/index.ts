import { __prod__ } from '../constants';
import Config from './Config';

let config: Config;
if (__prod__) {
  config = require('./prod');
} else {
  config = require('./dev');
}

export default config;
