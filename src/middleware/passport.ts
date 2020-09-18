import passport from 'passport';
const { Strategy: GoogleTokenStrategy } = require('passport-google-token');
import config from '../config';

passport.use(
  new GoogleTokenStrategy(
    {
      clientID: config.googleClientId,
      clientSecret: config.googleClientSecret,
    },
    // @ts-ignore
    (accessToken, refreshToken, profile, done) => {
      done(null, {
        accessToken,
        refreshToken,
        profile,
      });
    }
  )
);

export const authenticateGoogle = (
  req: Express.Request,
  res: Express.Response
) =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      'google-token',
      { session: false },
      (err, data, info) => {
        if (err) reject(err);
        resolve({ data, info });
      }
    )(req, res);
  });
