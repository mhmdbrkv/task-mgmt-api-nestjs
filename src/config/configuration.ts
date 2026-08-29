export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret-key', // default value
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  // add other namespaces as needed
});
