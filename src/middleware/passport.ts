import passport from 'passport';
const { Strategy: GoogleTokenStrategy } = require('passport-google-token');

passport.use(
  new GoogleTokenStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
