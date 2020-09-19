import redis from 'redis';
import connectRedis from 'connect-redis';
import session from 'express-session';

import { __prod__ } from '../constants';

const RedisStore = connectRedis(session);
const redisClient = redis.createClient(process.env.REDIS_URL!);

export default session({
  store: new RedisStore({
    client: redisClient,
    disableTouch: true,
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
    httpOnly: true,
    sameSite: 'lax', // csrf
    secure: __prod__, // cookie only works in https
  },
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET!,
  resave: false,
});
