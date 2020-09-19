import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection, getConnectionOptions } from 'typeorm';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { get } from 'lodash';

import { __prod__ } from './constants';
import sessionHandler from './services/session';
import { UserResolver } from './resolvers/UserResolver';
import { TodoResolver } from './resolvers/TodoResolver';
import { authChecker } from './utils/authChecker';

(async () => {
  const app = express();

  const corsOptions = {
    origin: process.env.ORIGIN,
    credentials: true,
  };
  app.use(cors(corsOptions));

  app.use(sessionHandler);

  const options = await getConnectionOptions(process.env.NODE_ENV);
  await createConnection({ ...options, name: 'default' });

  const schema = await buildSchema({
    resolvers: [UserResolver, TodoResolver],
    validate: true,
    authChecker: authChecker,
    pubSub: new RedisPubSub({
      publisher: new Redis(process.env.REDIS_URL),
      subscriber: new Redis(process.env.REDIS_URL),
    }),
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

  const PORT = process.env.PORT;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(
      `🚀 Subscsriptions ready at ws://localhost:${PORT}/subscriptions`
    );
  });
})();
