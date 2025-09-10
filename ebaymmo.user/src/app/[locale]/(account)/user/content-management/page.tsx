import ContentManagement from '@/components/ContentManagement/ContentManagement';
import usePagination from '@/hooks/usePagination';

export default async function Page({
    searchParams
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const resolvedParams = await searchParams;
    return <ContentManagement searchParams={resolvedParams} />;
}
