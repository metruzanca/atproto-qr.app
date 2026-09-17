const RKEY_RE = /^[a-zA-Z0-9_~.:-]{1,512}$/;

export function isValidRkey(rkey: string): boolean {
  return rkey !== '.' && rkey !== '..' && RKEY_RE.test(rkey);
}