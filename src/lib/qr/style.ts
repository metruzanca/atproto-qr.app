import type { RecursivePartial, Options } from '@liquid-js/qr-code-styling';

export interface QRStyle {
  size: number;
  shape: 'square' | 'circle';
  dotsType: string;
  dotsColor: string;
  cornersSquareType: string | null;
  cornersSquareColor: string | null;
  cornersDotType: string | null;
  cornersDotColor: string | null;
  backgroundColor: string;
  backgroundMargin: number;
  image: string | null;
  imageMargin: number;
  imageSize: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  imageProxy?: boolean;
}

export const DEFAULT_STYLE: QRStyle = {
  size: 512,
  shape: 'square',
  dotsType: 'square',
  dotsColor: '#0f172a',
  cornersSquareType: null,
  cornersSquareColor: null,
  cornersDotType: null,
  cornersDotColor: null,
  backgroundColor: '#ffffff',
  backgroundMargin: 0,
  image: null,
  imageMargin: 0,
  imageSize: 40,
  errorCorrectionLevel: 'H',
  imageProxy: false,
};

export const ERROR_CORRECTION_LEVELS: ('L' | 'M' | 'Q' | 'H')[] = ['L', 'M', 'Q', 'H'];

export function isDefaultStyle(style: QRStyle): boolean {
  return (Object.keys(DEFAULT_STYLE) as (keyof QRStyle)[]).every((key) => style[key] === DEFAULT_STYLE[key]);
}

const PROXY_FALLBACK_ORIGIN = 'https://images.weserv.nl';

function proxyOrigin(): string {
  return import.meta.env.VITE_IMAGE_PROXY || PROXY_FALLBACK_ORIGIN;
}

export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^(data|blob):/i.test(url)) return url;
  const origin = proxyOrigin();
  if (url.startsWith(origin) || url.startsWith(PROXY_FALLBACK_ORIGIN)) return url;
  if (!/^https?:\/\//i.test(url)) return url;
  return `${origin}/?url=${encodeURIComponent(url)}`;
}

export function styleToOptions(style: QRStyle, data: string): RecursivePartial<Options> {
  return {
    size: style.size,
    data,
    shape: style.shape,
    qrOptions: { errorCorrectionLevel: style.errorCorrectionLevel },
    dotsOptions: {
      type: style.dotsType as Options['dotsOptions']['type'],
      color: style.dotsColor,
    },
    cornersSquareOptions: style.cornersSquareType
      ? {
          type: style.cornersSquareType as NonNullable<Options['cornersSquareOptions']>['type'],
          color: style.cornersSquareColor ?? style.dotsColor,
        }
      : undefined,
    cornersDotOptions: style.cornersDotType
      ? {
          type: style.cornersDotType as NonNullable<Options['cornersDotOptions']>['type'],
          color: style.cornersDotColor ?? style.dotsColor,
        }
      : undefined,
    backgroundOptions: { color: style.backgroundColor, margin: style.backgroundMargin },
    image: style.image
      ? style.imageProxy
        ? (proxyImageUrl(style.image) ?? undefined)
        : style.image
      : undefined,
    imageOptions: {
      margin: style.imageMargin,
      imageSize: style.imageSize > 1 ? style.imageSize / 100 : style.imageSize,
      crossOrigin: 'anonymous',
    },
  };
}