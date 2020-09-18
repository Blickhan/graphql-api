export type NodeEnv = 'production' | 'development';

export default interface ServerConfig {
  nodeEnv: NodeEnv;
  port: string | number;
  origin: string;
  sessionSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}
