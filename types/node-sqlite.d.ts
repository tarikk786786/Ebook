declare module 'node:sqlite' {
  export interface DatabaseSyncOptions {
    readOnly?: boolean;
    allowExtension?: boolean;
    enableForeignKeys?: boolean;
  }

  export interface StatementSync {
    get(...params: unknown[]): any;
    all(...params: unknown[]): any[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(path: string, options?: DatabaseSyncOptions);
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    close(): void;
  }
}
