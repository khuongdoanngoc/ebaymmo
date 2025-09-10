import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    const session = await auth();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ suggestions: [] });
    }

    const apiUrl = process.env.SEARCH_API_URL;

    try {
        let response;
        if (!session) {
            response = await fetch(
                `${apiUrl}/elasticsearch-sync/search-suggestions?query=${query}`
            );
        } else {
            response = await fetch(
                `${apiUrl}/elasticsearch-sync/user-search-suggestions?query=${query}`,
                {
                    headers: {
                        Authorization: `Bearer ${session.user.accessToken}`
                    }
                }
            );
        }

        if (!response.ok) {
            throw new Error('Failed to fetch search suggestions');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching search suggestions:', error);
        return NextResponse.json(
            { suggestions: [], error: 'Failed to fetch suggestions' },
            { status: 500 }
        );
    }
}
