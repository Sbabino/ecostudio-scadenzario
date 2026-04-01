import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, cliente_id, ruolo, user_id } = body;
    const admin = getAdminClient();

    if (action === 'create') {
      // Create auth user
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

      // Create profile
      const { error: profError } = await admin.from('profili').insert({
        id: authData.user.id,
        email,
        ruolo: ruolo || 'cliente',
        cliente_id: cliente_id || null,
        nome_visualizzato: email,
        attivo: true,
      });
      if (profError) return NextResponse.json({ error: profError.message }, { status: 400 });

      return NextResponse.json({ success: true, user_id: authData.user.id });
    }

    if (action === 'disable') {
      await admin.from('profili').update({ attivo: false }).eq('id', user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'enable') {
      await admin.from('profili').update({ attivo: true }).eq('id', user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'reset_password') {
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await admin.from('profili').delete().eq('id', user_id);
      await admin.auth.admin.deleteUser(user_id);
      return NextResponse.json({ success: true });
    }

    if (action === 'list') {
      const { data } = await admin.from('profili').select('*');
      return NextResponse.json({ profiles: data || [] });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
