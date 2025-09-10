import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { format } from 'date-fns';
import adminSDK from '@/adminSDK';

export async function POST(request: NextRequest) {
    try {
        // Kiểm tra xác thực
        const session = await auth();
        if (!session?.user?.accessToken) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Lấy productId từ request body
        const data = await request.json();
        const { productId } = data;

        if (!productId) {
            return NextResponse.json(
                { success: false, message: 'Product ID is required' },
                { status: 400 }
            );
        }


        // Truy vấn các sản phẩm chưa bán sử dụng adminSDK thay vì Apollo Client
        const result = await adminSDK.GetUnsoldProductItems({
            productId
        });

        const unsoldItems = result.productItems || [];


        if (unsoldItems.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No unsold products found' },
                { status: 404 }
            );
        }

        // Tạo nội dung file text
        const fileContent = unsoldItems
            .map((item) => item.dataText || '')
            .join('\n');

        // Tạo tên file với timestamp
        const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
        const filename = `unsold-products-${timestamp}.txt`;

        // Lưu số lượng sản phẩm để cập nhật trong message
        const itemCount = unsoldItems.length;

        // Xóa các sản phẩm đã download - sử dụng adminSDK thay vì Apollo client
        const deleteResult = await adminSDK.DeleteUnsoldProductItems({
            productId
        });

        const deletedCount = deleteResult.deleteProductItems?.affectedRows || 0;


        // Trả về file để download với header báo cho client số lượng đã xóa
        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': 'text/plain',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'X-Items-Deleted': String(deletedCount),
                'X-Items-Downloaded': String(itemCount)
            }
        });
    } catch (error) {
        console.error('Error generating download file:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to generate download file',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
