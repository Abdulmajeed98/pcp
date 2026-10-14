// Where a PostgreSQL database is, the way an application's settings give it:
// an address that names the host, the port and the database, and the login
// apart from it.
export type Datasource = {
  url: string;
  username: string;
  password: string;
};

// What `pg` needs to connect to a datasource. Only the address's host, port
// and database are read: a login or options written into the address are not.
export function connectionOf(datasource: Datasource): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
} {
  const url = new URL(datasource.url);

  return {
    host: url.hostname,
    port: url.port === '' ? 5432 : Number(url.port),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: datasource.username,
    password: datasource.password,
  };
}
