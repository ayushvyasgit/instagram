const { Client } = require('pg');

// You can configure these with your own environment variables or use defaults
const client = new Client({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'password',
  database: process.env.PGDATABASE || 'postgres'
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    // You can run queries here or export the client instance
    return client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
  });