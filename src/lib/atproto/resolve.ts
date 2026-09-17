import type { ActorIdentifier } from '@atcute/lexicons';

import { identityResolver } from './auth';

export interface ResolvedActor {
  did: string;
  handle: string;
  pds: string;
}

export async function resolveHandle(handle: string): Promise<ResolvedActor> {
  return identityResolver.resolve(handle as ActorIdentifier);
}