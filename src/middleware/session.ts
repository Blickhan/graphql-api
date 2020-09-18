import redis from 'redis';
import connectRedis from 'connect-redis';
import session from 'express-session';

import config from '../config';
import { __prod__ } from '../constants';

const RedisStore = connectRedis(session);
const redisClient = redis.createClient();

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
  secret: config.sessionSecret,
  resave: false,
});
