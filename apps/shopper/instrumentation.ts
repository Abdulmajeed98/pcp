import { settingsOf } from '@/shared/config';

// Next calls this once when the Shopper app's server starts, and answers no
// request before it has returned. It reads every setting, so that a
// malformed one stops the server with a message that names it, as the API
// checks its own settings when it starts.
export function register(): void {
  settingsOf(process.env);
}
