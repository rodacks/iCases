import { cookies } from 'next/headers';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PublicError } from './errors';
export async function owner() {
  const jar = await cookies();
  let id = jar.get('icases-session')?.value;
  if (!id || !/^\w{8}-[\w-]{27}$/.test(id)) {
    id = randomUUID();
    jar.set('icases-session', id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  // Next's internal URL may use localhost even when the browser uses 127.0.0.1.
  const expected =
    process.env.APP_ORIGIN || `${url.protocol}//${req.headers.get('host') || url.host}`;
  if (origin && origin !== expected) throw new PublicError('Origen de solicitud no permitido');
  if (!origin && req.headers.get('sec-fetch-site') === 'cross-site')
    throw new PublicError('Origen de solicitud no permitido');
}
export async function limitedBody(req: Request, limit: number) {
  if (Number(req.headers.get('content-length') || 0) > limit)
    throw new PublicError('Solicitud demasiado grande');
  const reader = req.body?.getReader();
  if (!reader) throw new PublicError('La solicitud está vacía');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new PublicError('Solicitud demasiado grande');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new Uint8Array(Buffer.concat(chunks));
}
export async function jsonBody(req: Request) {
  return JSON.parse(new TextDecoder().decode(await limitedBody(req, 100_000)));
}
export function failure(e: unknown) {
  if (e instanceof ZodError)
    return NextResponse.json(
      { error: 'Revisá los datos ingresados.', details: e.flatten() },
      { status: 400 },
    );
  if (e instanceof SyntaxError)
    return NextResponse.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
  if (!(e instanceof PublicError)) console.error(e);
  return NextResponse.json(
    {
      error:
        e instanceof PublicError ? e.message : 'No pudimos guardar los datos. Intentá de nuevo.',
    },
    { status: e instanceof PublicError ? 400 : 500 },
  );
}
