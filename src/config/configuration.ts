export default () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret-key', // default value
    expiresIn: process.env.JWT_EXPIRES_IN ?? '5h',
  },
  // add other namespaces as needed
});
