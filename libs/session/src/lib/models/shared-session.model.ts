import { SessionContext } from '../contracts/session-context';

export interface SharedSession {
  id: string;
  context: SessionContext;
  lastActivityAt: number;
}

export type SessionUpdate =
  | { type: 'login'; snapshot: SharedSession }
  | { type: 'logout'; sessionId: string }
  | { type: 'activity'; sessionId: string; lastActivityAt: number }
  | { type: 'token'; sessionId: string; token: string };

export type SessionTabMessage = SessionUpdate
  | { type: 'request'; requestId: string }
  | { type: 'reply'; requestId: string; snapshot: SharedSession };
