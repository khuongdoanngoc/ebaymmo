import { NextResponse } from 'next/server';

export async function GET() {
    const apiUrl = process.env.SEARCH_API_URL;

    try {
        const response = await fetch(
            `${apiUrl}/elasticsearch-sync/search-stats/top3`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch top search stats');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching top search stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch top search stats' },
            { status: 500 }
        );
    }
}
