import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user.accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const apiUrl = process.env.SEARCH_API_URL;

        const response = await axios.get(
            `${apiUrl}/elasticsearch-sync/search-history`,
            {
                headers: {
                    Authorization: `Bearer ${session.user.accessToken}`
                }
            }
        );

        return NextResponse.json(response.data);
    } catch (error) {
        console.error('Error fetching search history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch search history' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get session using the auth function from your auth.ts file
        const session = await auth();

        if (!session || !session.user.accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchText } = await req.json();

        if (!searchText) {
            return NextResponse.json(
                { error: 'Search text is required' },
                { status: 400 }
            );
        }

        const apiUrl = process.env.SEARCH_API_URL;
        const response = await axios.post(
            `${apiUrl}/elasticsearch-sync/search-history`,
            {
                content: searchText
            },
            {
                headers: {
                    Authorization: `Bearer ${session.user.accessToken}`
                }
            }
        );

        return NextResponse.json(response.data, { status: 201 });
    } catch (error) {
        console.error('Error creating search history:', error);
        return NextResponse.json(
            { error: 'Failed to create search history' },
            { status: 500 }
        );
    }
}
