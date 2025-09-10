import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@/auth';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || !session.user.accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: searchId } = await params;

        if (!searchId) {
            return NextResponse.json(
                { error: 'Search ID is required' },
                { status: 400 }
            );
        }

        const apiUrl = process.env.SEARCH_API_URL;
        await axios.delete(
            `${apiUrl}/elasticsearch-sync/search-history/${searchId}`,
            {
                headers: {
                    Authorization: `Bearer ${session.user.accessToken}`
                }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting search history:', error);
        return NextResponse.json(
            { error: 'Failed to delete search history' },
            { status: 500 }
        );
    }
}
