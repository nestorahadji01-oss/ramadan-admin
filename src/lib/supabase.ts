import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for read operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for write operations (bypasses RLS)
// Falls back to anon key if service_role is not configured (will fail on RLS-protected tables)
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : supabase; // Fallback - will show RLS errors but won't crash

// Types
export interface ActivationCode {
    id: string;
    phone: string;
    order_id: string;
    customer_name: string | null;
    customer_email: string | null;
    device_id: string | null;
    used: boolean;
    used_at: string | null;
    created_at: string;
}

export interface DashboardStats {
    totalCodes: number;
    activatedCodes: number;
    todayActivations: number;
    weekActivations: number;
}

// Dashboard stats
export async function getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalResult, activatedResult, todayResult, weekResult] = await Promise.all([
        supabase.from('activation_codes').select('id', { count: 'exact', head: true }),
        supabase.from('activation_codes').select('id', { count: 'exact', head: true }).eq('used', true),
        supabase.from('activation_codes').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('activation_codes').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
    ]);

    return {
        totalCodes: totalResult.count || 0,
        activatedCodes: activatedResult.count || 0,
        todayActivations: todayResult.count || 0,
        weekActivations: weekResult.count || 0,
    };
}

// Get all activation codes
export async function getActivationCodes(page = 1, limit = 20): Promise<{ codes: ActivationCode[]; total: number }> {
    const offset = (page - 1) * limit;

    const { count } = await supabase
        .from('activation_codes')
        .select('*', { count: 'exact', head: true });

    const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching codes:', error);
        return { codes: [], total: 0 };
    }

    return { codes: data || [], total: count || 0 };
}

// Search codes
export async function searchCodes(query: string): Promise<ActivationCode[]> {
    const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .or(`phone.ilike.%${query}%,customer_name.ilike.%${query}%,customer_email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error searching codes:', error);
        return [];
    }

    return data || [];
}

// Add code manually
export async function addActivationCode(data: {
    phone: string;
    customer_name?: string;
    customer_email?: string;
}): Promise<{ success: boolean; error?: string }> {
    // Normalize phone
    let phone = data.phone.replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) phone = '+' + phone;

    const { error } = await supabaseAdmin.from('activation_codes').insert({
        phone,
        order_id: `ADMIN-${Date.now()}`,
        customer_name: data.customer_name || 'Manual Entry',
        customer_email: data.customer_email || null,
        device_id: null,
        used: false,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Delete code
export async function deleteActivationCode(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin.from('activation_codes').delete().eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Reset device (allow re-activation)
export async function resetDeviceActivation(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin
        .from('activation_codes')
        .update({ device_id: null, used: false, used_at: null })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Get recent activations for chart
export async function getRecentActivations(days = 7): Promise<{ date: string; count: number }[]> {
    const result: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count } = await supabase
            .from('activation_codes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dateStr)
            .lt('created_at', nextDate.toISOString().split('T')[0]);

        result.push({ date: dateStr, count: count || 0 });
    }

    return result;
}

// ========================================
// E-BOOK FUNCTIONS
// ========================================

export interface EBook {
    id: string;
    title: string;
    author: string | null;
    category: string;
    description: string | null;
    file_url: string;
    cover_url: string | null;
    pages: number | null;
    created_at: string;
}

const EBOOK_CATEGORIES = [
    'Coran',
    'Hadith',
    'Fiqh',
    'Sira',
    'Spiritualité',
    'Ramadan',
    'Invocations',
    'Autre',
];

export { EBOOK_CATEGORIES };

// Get all e-books
export async function getEBooks(): Promise<EBook[]> {
    const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching ebooks:', error);
        return [];
    }

    return data || [];
}

// Get e-books by category
export async function getEBooksByCategory(category: string): Promise<EBook[]> {
    const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching ebooks by category:', error);
        return [];
    }

    return data || [];
}

// Upload file to Supabase Storage
export async function uploadFile(
    file: File,
    bucket: string,
    path: string
): Promise<{ url: string | null; error: string | null }> {
    const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Upload error:', error);
        return { url: null, error: error.message };
    }

    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, error: null };
}

// Add e-book
export async function addEBook(data: {
    title: string;
    author?: string;
    category: string;
    description?: string;
    file_url: string;
    cover_url?: string;
    pages?: number;
}): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin.from('ebooks').insert({
        title: data.title,
        author: data.author || null,
        category: data.category,
        description: data.description || null,
        file_url: data.file_url,
        cover_url: data.cover_url || null,
        pages: data.pages || null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Update e-book
export async function updateEBook(
    id: string,
    data: Partial<Omit<EBook, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin.from('ebooks').update(data).eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Delete e-book
export async function deleteEBook(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseAdmin.from('ebooks').delete().eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

