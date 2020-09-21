import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import { __prod__ } from '../constants';

const RedisStore = connectRedis(session);

const sessionHandler = session({
  store: new RedisStore({
    client: new Redis(process.env.REDIS_URL),
    disableTouch: true,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
    httpOnly: true,
    sameSite: __prod__ ? 'none' : 'lax',
    secure: __prod__, // cookie only works in https
  },
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET!,
  resave: false,
});

export default sessionHandler;
