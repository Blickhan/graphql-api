import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection, getConnectionOptions } from 'typeorm';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { get } from 'lodash';

import config from './config';
import sessionHandler from './middleware/session';
import { UserResolver } from './resolvers/UserResolver';
import { __prod__ } from './constants';
import { TodoResolver } from './resolvers/TodoResolver';
import { authChecker } from './utils/authChecker';

import './middleware/passport';

(async () => {
  const app = express();

  const corsOptions = {
    origin: config.origin,
    credentials: true,
  };
  app.use(cors(corsOptions));

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

  httpServer.listen(config.port, () => {
    console.log(`🚀 Server ready at http://localhost:${config.port}/graphql`);
    console.log(
      `🚀 Subscsriptions ready at ws://localhost:${config.port}/subscriptions`
    );
  });
})();
