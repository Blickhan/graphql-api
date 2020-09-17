export type NodeEnv = 'production' | 'development';

export default interface Config {
  nodeEnv: NodeEnv;
  sessionSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}
