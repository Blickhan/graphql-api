import ServerConfig, { NodeEnv } from './Config';

const config: ServerConfig = {
  nodeEnv: process.env.NODE_ENV as NodeEnv,
  port: process.env.PORT || 4000,
  origin: process.env.ORIGIN!,
  sessionSecret: process.env.SESSION_SECRET!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  // process.env.DATABASE_URL
};

export default config;
