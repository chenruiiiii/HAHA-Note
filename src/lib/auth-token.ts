import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/constants/auth';

export interface AuthUserPayload {
  userId: string;
  username: string;
  role: string;
  nickname: string;
}

type TokenType = 'access' | 'refresh';

interface TokenPayload extends AuthUserPayload {
  type: TokenType;
  exp: number;
  iat: number;
}

interface VerifiedToken<T extends TokenType> {
  valid: boolean;
  expired: boolean;
  payload: (TokenPayload & { type: T }) | null;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'dev-only-auth-token-secret-change-me';

function toBase64Url(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signTokenPayload(payload: TokenPayload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  return `${data}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken<T extends TokenType>(
  token: string | undefined,
  expectedType: T
): Promise<VerifiedToken<T>> {
  if (!token) {
    return { valid: false, expired: false, payload: null };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return { valid: false, expired: false, payload: null };
  }

  try {
    const key = await importSigningKey();
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSignature),
      encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!verified) {
      return { valid: false, expired: false, payload: null };
    }

    const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload))) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.type !== expectedType) {
      return { valid: false, expired: false, payload: null };
    }

    if (payload.exp <= now) {
      return {
        valid: false,
        expired: true,
        payload: payload as TokenPayload & { type: T },
      };
    }

    return {
      valid: true,
      expired: false,
      payload: payload as TokenPayload & { type: T },
    };
  } catch {
    return { valid: false, expired: false, payload: null };
  }
}

function createTokenPayload(
  user: AuthUserPayload,
  type: TokenType,
  ttlSeconds: number
): TokenPayload {
  const now = Math.floor(Date.now() / 1000);

  return {
    ...user,
    type,
    iat: now,
    exp: now + ttlSeconds,
  };
}

export async function createAccessToken(user: AuthUserPayload) {
  return signTokenPayload(createTokenPayload(user, 'access', ACCESS_TOKEN_TTL_SECONDS));
}

export async function createRefreshToken(user: AuthUserPayload) {
  return signTokenPayload(createTokenPayload(user, 'refresh', REFRESH_TOKEN_TTL_SECONDS));
}

export async function verifyAccessToken(token: string | undefined) {
  return verifyToken(token, 'access');
}

export async function verifyRefreshToken(token: string | undefined) {
  return verifyToken(token, 'refresh');
}

export function shouldRefreshAccessToken(exp: number) {
  const now = Math.floor(Date.now() / 1000);

  return exp - now <= ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS;
}

export function getAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function getAccessTokenCookieOptions() {
  return getAuthCookieOptions(ACCESS_TOKEN_TTL_SECONDS);
}

export function getRefreshTokenCookieOptions() {
  return getAuthCookieOptions(REFRESH_TOKEN_TTL_SECONDS);
}

export function clearAuthCookies(response: {
  cookies: {
    set: (options: {
      name: string;
      value: string;
      httpOnly: boolean;
      sameSite: 'lax';
      secure: boolean;
      path: string;
      maxAge: number;
    }) => void;
  };
}) {
  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: '',
    ...getAccessTokenCookieOptions(),
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: '',
    ...getRefreshTokenCookieOptions(),
    maxAge: 0,
  });
}
