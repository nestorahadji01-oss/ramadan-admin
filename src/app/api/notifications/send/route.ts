import { NextRequest, NextResponse } from 'next/server';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

interface NotificationPayload {
    title: string;
    message: string;
    targetUrl?: string;
    segment?: string;
}

/**
 * Send push notification via OneSignal API
 * POST /api/notifications/send
 */
export async function POST(request: NextRequest) {
    try {
        // Debug: log credential status (not the actual keys)
        console.log('OneSignal Config:', {
            hasAppId: !!ONESIGNAL_APP_ID,
            hasApiKey: !!ONESIGNAL_REST_API_KEY,
            appIdLength: ONESIGNAL_APP_ID?.length || 0,
        });

        // Verify credentials are configured
        if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
            console.error('Missing OneSignal credentials. Check Vercel environment variables.');
            return NextResponse.json(
                {
                    success: false,
                    error: 'OneSignal non configuré! Ajoutez ONESIGNAL_APP_ID et ONESIGNAL_REST_API_KEY dans Vercel → Settings → Environment Variables'
                },
                { status: 500 }
            );
        }

        const body: NotificationPayload = await request.json();
        const { title, message, targetUrl, segment = 'Subscribed Users' } = body;

        // Validate required fields
        if (!title || !message) {
            return NextResponse.json(
                { success: false, error: 'Title and message are required' },
                { status: 400 }
            );
        }

        // Build OneSignal notification payload
        const notificationPayload: Record<string, unknown> = {
            app_id: ONESIGNAL_APP_ID,
            included_segments: [segment],
            headings: { en: title, fr: title },
            contents: { en: message, fr: message },
        };

        // Add deep link if targetUrl is provided
        if (targetUrl) {
            notificationPayload.data = { targetUrl };
        }

        // Send to OneSignal API
        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(notificationPayload),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('OneSignal API error:', result);
            return NextResponse.json(
                { success: false, error: result.errors?.[0] || 'Failed to send notification' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            notification_id: result.id,
            recipients: result.recipients,
        });

    } catch (error) {
        console.error('Notification error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Get notification stats
 * GET /api/notifications/send?id=notification_id
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
        return NextResponse.json(
            { success: false, error: 'Notification ID required' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://api.onesignal.com/notifications/${notificationId}?app_id=${ONESIGNAL_APP_ID}`,
            {
                headers: {
                    'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
                },
            }
        );

        const result = await response.json();

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Failed to get notification stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get notification stats' },
            { status: 500 }
        );
    }
}
