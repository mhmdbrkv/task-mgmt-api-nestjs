export default () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret-key', // default value
    expiresIn: process.env.JWT_EXPIRES_IN ?? '5h',
  },
  // add other namespaces as needed
});
