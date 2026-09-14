import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // El cliente manda su JWT en el header Authorization al invocar la función
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 });
    }

    // Cliente "de usuario": solo sirve para averiguar QUIÉN está pidiendo esto,
    // usando su propio token (no tiene permisos de admin).
    const supabaseUsuario = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: errorUsuario } = await supabaseUsuario.auth.getUser();
    if (errorUsuario || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401 });
    }

    // Cliente "admin": este sí tiene la service role key, que Supabase
    // inyecta sola como variable de entorno. NUNCA la pegamos a mano acá.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Borrar los archivos de audio del usuario en Storage.
    // Las filas de las demás tablas (tareas, plan_del_dia, notas, recordatorios,
    // grabaciones) se borran solas por el "on delete cascade" en user_id,
    // pero los archivos del bucket no son filas de Postgres, así que hay
    // que borrarlos a mano antes de borrar al usuario.
    const { data: archivos } = await supabaseAdmin.storage
      .from("grabaciones")
      .list(user.id);

    if (archivos && archivos.length > 0) {
      const paths = archivos.map((a) => `${user.id}/${a.name}`);
      await supabaseAdmin.storage.from("grabaciones").remove(paths);
    }

    // Borrar al usuario de auth.users (esto dispara el cascade en las tablas).
    const { error: errorDelete } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (errorDelete) {
      return new Response(JSON.stringify({ error: errorDelete.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});