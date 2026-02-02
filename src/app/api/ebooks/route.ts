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

export async function POST(request: NextRequest) {
    try {
        // Check if supabaseAdmin is configured
        if (!supabaseAdmin) {
            console.error('Missing env vars:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceRoleKey
            });
            return NextResponse.json(
                { success: false, error: 'Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY)' },
                { status: 500 }
            );
        }

        const formData = await request.formData();

        const title = formData.get('title') as string;
        const author = formData.get('author') as string | null;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string | null;
        const pages = formData.get('pages') as string | null;
        const pdfFile = formData.get('pdf') as File | null;
        const coverFile = formData.get('cover') as File | null;

        if (!title || !category || !pdfFile) {
            return NextResponse.json(
                { success: false, error: 'Titre, catégorie et fichier PDF requis' },
                { status: 400 }
            );
        }

        // Upload PDF
        const pdfPath = `ebooks/${Date.now()}-${pdfFile.name}`;
        const pdfBuffer = await pdfFile.arrayBuffer();

        const { error: pdfError } = await supabaseAdmin.storage
            .from('ebooks')
            .upload(pdfPath, pdfBuffer, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: true
            });

        if (pdfError) {
            console.error('PDF upload error:', pdfError);
            return NextResponse.json(
                { success: false, error: `Erreur upload PDF: ${pdfError.message}` },
                { status: 500 }
            );
        }

        const { data: pdfUrlData } = supabaseAdmin.storage
            .from('ebooks')
            .getPublicUrl(pdfPath);

        // Upload cover if provided
        let coverUrl: string | null = null;
        if (coverFile) {
            const coverPath = `covers/${Date.now()}-${coverFile.name}`;
            const coverBuffer = await coverFile.arrayBuffer();

            const { error: coverError } = await supabaseAdmin.storage
                .from('ebooks')
                .upload(coverPath, coverBuffer, {
                    contentType: coverFile.type,
                    cacheControl: '3600',
                    upsert: true
                });

            if (!coverError) {
                const { data: coverUrlData } = supabaseAdmin.storage
                    .from('ebooks')
                    .getPublicUrl(coverPath);
                coverUrl = coverUrlData.publicUrl;
            }
        }

        // Insert into database
        const { error: dbError } = await supabaseAdmin.from('ebooks').insert({
            title,
            author: author || null,
            category,
            description: description || null,
            file_url: pdfUrlData.publicUrl,
            cover_url: coverUrl,
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

export async function DELETE(request: NextRequest) {
    try {
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
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
