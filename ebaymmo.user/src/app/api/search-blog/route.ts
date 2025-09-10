import { NextResponse } from 'next/server';
import adminSDK from '@/adminSDK';
import { OrderBy } from '@/generated/graphql';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tag = searchParams.get('tags') || '';
        const query = searchParams.get('query') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '6');
        const offset = (page - 1) * limit;

        const where: any = { isDeleted: { _isNull: true}};
        if (tag) {
            where.tags = { _contains: [tag] };
        }
        if (query) {
            where._or = [
                { title: { _ilike: `%${query}%` } },
                { description: { _ilike: `%${query}%` } }
            ];
        }

        const { blogs, blogsAggregate } = await adminSDK.GetBlogApis({
            where,
            limit,
            offset,
            orderBy: { postingDay: OrderBy.Desc }
        });

        const total = blogsAggregate?.aggregate?.count ?? 0;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            blogs,
            pagination: {
                total,
                totalPages,
                page,
                limit
            }
        });
    } catch (error: any) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch blogs' },
            { status: 500 }
        );
    }
}
