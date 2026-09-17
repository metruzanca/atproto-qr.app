const RKEY_RE = /^[a-zA-Z0-9_~.:-]{1,512}$/;

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isValidRkey(rkey: string): boolean {
  return rkey !== '.' && rkey !== '..' && RKEY_RE.test(rkey);
}

export function randomRkey(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}