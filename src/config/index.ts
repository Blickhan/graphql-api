import { __prod__ } from '../constants';
import ServerConfig from './Config';
import prodConfig from './prod';
import devConfig from './dev';

let config: ServerConfig;
if (__prod__) {
  config = prodConfig;
} else {
  config = devConfig;
}

export default config;
