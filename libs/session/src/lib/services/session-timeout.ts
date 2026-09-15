import { SessionContext } from '../contracts/session-context';
import { SessionPolicy } from '../models/session-policy.model';

export function sessionTimeoutMilliseconds(context: SessionContext, policy: SessionPolicy): number {
  const backend = context.sessionTimeoutSeconds;
  const seconds = policy.useBackendTimeout && Number.isFinite(backend) && backend > 0
    ? backend : policy.inactivityTimeoutSeconds;
  return Number.isFinite(seconds * 1000) && seconds > 0 ? seconds * 1000 : 15 * 60 * 1000;
}
