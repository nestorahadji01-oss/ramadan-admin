import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create admin client server-side where env vars are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// POST: Add ebook to database (files are uploaded directly to Storage from client)
export async function POST(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY)' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { title, author, category, description, pages, file_url, cover_url } = body;

        if (!title || !category || !file_url) {
            return NextResponse.json(
                { success: false, error: 'Titre, catégorie et file_url requis' },
                { status: 400 }
            );
        }

        // Insert into database using service_role to bypass RLS
        const { error: dbError } = await supabaseAdmin.from('ebooks').insert({
            title,
            author: author || null,
            category,
            description: description || null,
            file_url,
            cover_url: cover_url || null,
            pages: pages ? parseInt(pages) : null
        });

        if (dbError) {
            console.error('Database insert error:', dbError);
            return NextResponse.json(
                { success: false, error: `Erreur base de données: ${dbError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Ebook creation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        return NextResponse.json(
            { success: false, error: `Erreur serveur: ${errorMessage}` },
            { status: 500 }
        );
    }
}

// DELETE: Remove ebook from database
export async function DELETE(request: NextRequest) {
    try {
        if (!supabaseAdmin) {
            return NextResponse.json(
                { success: false, error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY)' },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID requis' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin.from('ebooks').delete().eq('id', id);

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Ebook deletion error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        return NextResponse.json(
            { success: false, error: `Erreur serveur: ${errorMessage}` },
            { status: 500 }
        );
    }
}
