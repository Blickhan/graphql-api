import 'reflect-metadata';
import http from 'http';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection, getConnectionOptions } from 'typeorm';
import redis from 'redis';
import connectRedis from 'connect-redis';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { get } from 'lodash';

import config from './config';
import { UserResolver } from './resolvers/UserResolver';
import { __prod__ } from './constants';
import { TodoResolver } from './resolvers/TodoResolver';
import { authChecker } from './utils/authChecker';

(async () => {
  const PORT = process.env.PORT || 4000;
  const app = express();

  const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
  };
  app.use(cors(corsOptions));

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();

  const sessionHandler = session({
    name: 'qid',
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

  app.use(sessionHandler);

  const options = await getConnectionOptions(config.nodeEnv);
  await createConnection({ ...options, name: 'default' });

  const schema = await buildSchema({
    resolvers: [UserResolver, TodoResolver],
    validate: true,
    authChecker: authChecker,
    pubSub: new RedisPubSub(),
  });

  const apolloServer = new ApolloServer({
    schema: schema,
    subscriptions: {
      path: '/subscriptions',
      keepAlive: 10000,
      onConnect: (_params, _ws, ctx) => {
        const promise = new Promise((resolve) => {
          const req = ctx.request as express.Request;
          const res = {} as express.Response;
          sessionHandler(req, res, () => {
            const userId = get(req, 'session.userId');
            return resolve({ userId });
          });
        });
        return promise;
      },
    },
    context: ({ req, res, connection }) => {
      if (connection) {
        return connection.context;
      } else {
        const userId = get(req, 'session.userId');
        return { req, res, userId };
      }
    },
  });

  apolloServer.applyMiddleware({ app, cors: false });

  const httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(
      `🚀 Subscsriptions ready at ws://localhost:${PORT}/subscriptions`
    );
  });
})();
