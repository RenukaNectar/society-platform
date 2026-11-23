declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xss: () => RequestHandler;
  export default xss;
}

declare module 'express-mysql-session' {
  import { Store } from 'express-session';
  
  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
  }
  
  class MySQLStore extends Store {
    constructor(options: MySQLStoreOptions);
  }
  
  const MySQLStore: typeof MySQLStore;
  export = MySQLStore;
} 