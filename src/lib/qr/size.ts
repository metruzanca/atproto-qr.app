/**
 * How big a QR matrix gets, without rendering one.
 *
 * Byte-mode capacity per version at error-correction level H (the app's default
 * style). Links are ASCII, so a string's length is its byte count, and the
 * matrix side is `17 + 4 * version`.
 *
 * Verified against `@liquid-js/qrcode-generator` for every version 1–40.
 */
const BYTE_CAPACITY_H = [
  7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439,
  461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1051, 1093, 1139, 1219, 1273,
];

/** Side length of the QR matrix (in modules) needed for `bytes` bytes of data. */
export function qrModulesForBytes(bytes: number): number {
  const index = BYTE_CAPACITY_H.findIndex((capacity) => bytes <= capacity);
  const version = index === -1 ? BYTE_CAPACITY_H.length : index + 1;
  return 17 + 4 * version;
}
