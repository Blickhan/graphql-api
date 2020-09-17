import Config, { NodeEnv } from './Config';

const config: Config = {
  nodeEnv: process.env.NODE_ENV as NodeEnv,
  sessionSecret: process.env.SESSION_SECRET!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
};

export default config;
