// Playwright-only entry: a new invocation starts with disposable data, even if the
// previous run was killed before its fixture finally blocks could execute.
import { resetE2eDatabase } from './e2eDatabase.mjs';

process.env.DATABASE_PATH = resetE2eDatabase(process.argv[2]);
await import('./server.mjs');
