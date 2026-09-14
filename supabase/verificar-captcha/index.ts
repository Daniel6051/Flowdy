import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HCAPTCHA_SECRET = Deno.env.get('HCAPTCHA_SECRET')!;

serve(async (req) => {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Falta el token' }), { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('secret', HCAPTCHA_SECRET);
    params.append('response', token);

    const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const result = await verifyRes.json();

    return new Response(JSON.stringify({ success: result.success === true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), { status: 500 });
  }
});