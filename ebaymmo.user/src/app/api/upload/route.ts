import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { ProductItemStatus, ProductUploadLogStatus } from '@/constants/enum';
import adminSDK from '@/adminSDK';

// Các regex patterns để kiểm tra format
const EMAIL_PATTERN = /^[^|]+@[^|]+\.[^|]+\|.+/;
const SOFTWARE_PATTERN = /^Software:\s+[^|]+(\|.*)?$/;
const ACCOUNT_PATTERN =
    /^Account:\s+[^|]+\|[^|]+((\|.*)|(\s+and\s+.*)|(\s+or\s+.*))?$/;
const IP_PATTERN =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\|.+$/;
const OTHER_PATTERN = /^Other:\s+.+/;

/**
 * Kiểm tra xem một dòng có phải là định dạng hợp lệ không
 */
function isValidFormat(line: string): boolean {
    // Kiểm tra xem có phải là đoạn văn bản dài không
    if (line.split(' ').length > 20) {
        return false;
    }

    // Kiểm tra các định dạng hợp lệ
    return (
        EMAIL_PATTERN.test(line) ||
        SOFTWARE_PATTERN.test(line) ||
        ACCOUNT_PATTERN.test(line) ||
        IP_PATTERN.test(line) ||
        OTHER_PATTERN.test(line)
    );
}

/**
 * Handles file upload requests
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get('file') as File | null;
        const files = formData.getAll('files') as File[];

        if (files.length > 1) {
            return handleMultipleFilesUpload(files, formData);
        } else if (files.length === 1 || file) {
            return handleSingleFileUpload(files[0] || file, formData);
        } else {
            return NextResponse.json(
                { success: false, message: 'No files provided' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('=== Detailed Error in POST handler ===');
        console.error('Error type:', error?.constructor?.name);
        console.error(
            'Error message:',
            error instanceof Error ? error.message : String(error)
        );
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        return NextResponse.json(
            {
                success: false,
                message: 'File upload failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: error?.constructor?.name
            },
            { status: 500 }
        );
    }
}

/**
 * Handles single file upload
 */
async function handleSingleFileUpload(file: File, formData: FormData) {
    let filePath = '';
    try {
        // Get session and token
        const session = await auth();

        if (!session?.user?.accessToken) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });
        filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/${fileName}`;

        // Process file content
        const content = await file.text();
        // Phân tách theo dòng và lọc bỏ dòng trống ngay từ đầu
        const allLines = content.split('\n');
        const nonEmptyLines = allLines.filter((line) => line.trim() !== '');

        const productId = formData.get('productId');

        if (!productId) {
            throw new Error('Product ID is required');
        }

        // Lấy thông tin duplicateProduct của store sử dụng adminSDK
        const storeSettingResult =
            await adminSDK.GetStoreDuplicateProductSetting({
                productId
            });

        // Lấy giá trị duplicateProduct, mặc định là false nếu null
        const duplicateProduct =
            storeSettingResult?.productsByPk?.store?.duplicateProduct || false;

        // Kiểm tra cả định dạng và trùng lặp nội bộ nếu duplicateProduct là false
        const identifiersMap = new Map(); // Giữ lại để kiểm tra trùng lặp
        const invalidLines = []; // Mảng để lưu các dòng không hợp lệ (định dạng sai)

        // Tạo danh sách product items, kiểm tra định dạng và trùng lặp
        const productItems = [];

        for (const line of nonEmptyLines) {
            const trimmedLine = line.trim();

            // Kiểm tra định dạng
            const hasInvalidFormat =
                trimmedLine.includes(' |') || // Dấu cách trước dấu |
                trimmedLine.includes('| ') || // Dấu cách sau dấu |
                !trimmedLine.includes('|') || // Không có dấu | trong chuỗi
                trimmedLine.length < 3 || // Quá ngắn để là dữ liệu hợp lệ
                !isValidFormat(trimmedLine); // Kiểm tra định dạng theo yêu cầu

            if (hasInvalidFormat) {
                invalidLines.push(trimmedLine);
                continue;
            }

            // Lấy identifier từ dòng dữ liệu
            const identifier = trimmedLine.split('|')[0].trim().toLowerCase();

            // Kiểm tra trùng lặp trong nội bộ file chỉ khi duplicateProduct là false
            const isDuplicate =
                !duplicateProduct && identifiersMap.has(identifier);

            // Đánh dấu identifier đã xuất hiện (chỉ khi duplicateProduct là false)
            if (!duplicateProduct) {
                identifiersMap.set(identifier, true);
            }

            // Thêm vào danh sách sẽ insert
            productItems.push({
                productId: productId as string,
                dataText: trimmedLine,
                content: null,
                isDuplicate: isDuplicate, // Đánh dấu trùng lặp nội bộ
                status: ProductItemStatus.NotSale,
                exportedAt: null,
                createAt: new Date().toISOString(),
                updateAt: new Date().toISOString(),
                serialKey: null,
                expirationDate: null
            });
        }

        try {
            
            // Insert product items sử dụng adminSDK
            const itemsResult = await adminSDK.CreateMultipleProductItems({
                objects: productItems
            });

            // Số lượng items đã insert thành công
            const validItemsCount = productItems.length;

            // Cập nhật stock_count của sản phẩm sử dụng adminSDK
            if (validItemsCount > 0) {
                const updateStockResult =
                    await adminSDK.UpdateProductStockCount({
                        productId: productId,
                        incrementBy: validItemsCount
                    });
            }

            // Create upload log với số dòng không hợp lệ sử dụng adminSDK
            const uploadLogResult = await adminSDK.CreateProductUploadLog({
                object: {
                    productId: productId,
                    userId: session.user.id,
                    fileSize: file.size,
                    fileName: file.name,
                    validRowCount: productItems.length,
                    invalidRowCount: invalidLines.length,
                    createdAt: new Date().toISOString(),
                    status: ProductUploadLogStatus.Success
                }
            });

            // After successful database insertion, delete the file
            try {
                await unlink(filePath);
            } catch (deleteError) {
                console.error('Error deleting file:', deleteError);
            }

            return NextResponse.json({
                success: true,
                url: fileUrl,
                itemsInserted:
                    itemsResult?.insertProductItems?.affectedRows || 0,
                stockCountIncreased: validItemsCount,
                message: 'File uploaded and processed successfully',
                sampleData: productItems
                    .slice(0, 5)
                    .map((item) => item.dataText),
                totalLines: nonEmptyLines.length, // Chỉ trả về tổng số dòng không trống
                validLines: productItems.length,
                invalidLines: invalidLines.length,
                duplicateCount: productItems.filter((item) => item.isDuplicate)
                    .length,
                invalidSamples: invalidLines.slice(0, 5)
            });
        } catch (error) {
            console.error('Error details:', error);
            // If error occurs and file exists, try to delete it
            if (filePath) {
                try {
                    await unlink(filePath);
                } catch (deleteError) {
                    console.error(
                        'Error deleting file after error:',
                        deleteError
                    );
                }
            }

            console.error('=== Detailed Error in handleSingleFileUpload ===');
            console.error('Error type:', error?.constructor?.name);
            console.error(
                'Error message:',
                error instanceof Error ? error.message : String(error)
            );
            if (error instanceof Error) {
                console.error('Stack trace:', error.stack);
            }
            return NextResponse.json(
                {
                    success: false,
                    message: 'File upload failed',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    errorType: error?.constructor?.name
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error details:', error);
        // If error occurs and file exists, try to delete it
        if (filePath) {
            try {
                await unlink(filePath);
            } catch (deleteError) {
                console.error('Error deleting file after error:', deleteError);
            }
        }

        console.error('=== Detailed Error in handleSingleFileUpload ===');
        console.error('Error type:', error?.constructor?.name);
        console.error(
            'Error message:',
            error instanceof Error ? error.message : String(error)
        );
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        return NextResponse.json(
            {
                success: false,
                message: 'File upload failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: error?.constructor?.name
            },
            { status: 500 }
        );
    }
}

/**
 * Handles multiple files upload
 */
async function handleMultipleFilesUpload(files: File[], formData: FormData) {
    const uploadResults = [];
    const errors = [];
    let totalItemsInserted = 0;
    let totalInvalidLines = 0;
    let totalDuplicateCount = 0;
    let totalValidLines = 0;

    try {
        // Get session and token
        const session = await auth();
        if (!session?.user?.accessToken) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const productId = formData.get('productId');
        if (!productId) {
            throw new Error('Product ID is required');
        }

        // Lấy thông tin duplicateProduct của store sử dụng adminSDK
        const storeSettingResult =
            await adminSDK.GetStoreDuplicateProductSetting({
                productId
            });

        // Lấy giá trị duplicateProduct, mặc định là false nếu null
        const duplicateProduct =
            storeSettingResult?.productsByPk?.store?.duplicateProduct || false;


        // Map để theo dõi identifier trên tất cả các file (chỉ khi duplicateProduct là false)
        const allIdentifiersMap = new Map();

        // Xử lý từng file
        for (const file of files) {
            try {
                // Process file content
                const content = await file.text();
                // Phân tách theo dòng và lọc bỏ dòng trống ngay từ đầu
                const allLines = content.split('\n');
                const nonEmptyLines = allLines.filter(
                    (line) => line.trim() !== ''
                );

                // Tạo danh sách dòng không hợp lệ
                const invalidLines = [];

                // Chuẩn bị danh sách items với kiểm tra định dạng và trùng lặp
                const productItems = [];

                for (const line of nonEmptyLines) {
                    const trimmedLine = line.trim();

                    // Kiểm tra định dạng
                    const hasInvalidFormat =
                        trimmedLine.includes(' |') || // Dấu cách trước dấu |
                        trimmedLine.includes('| ') || // Dấu cách sau dấu |
                        !trimmedLine.includes('|') || // Không có dấu | trong chuỗi
                        trimmedLine.length < 3 || // Quá ngắn để là dữ liệu hợp lệ
                        !isValidFormat(trimmedLine); // Kiểm tra định dạng theo yêu cầu

                    if (hasInvalidFormat) {
                        invalidLines.push(trimmedLine);
                        continue;
                    }

                    // Lấy identifier từ dòng dữ liệu
                    const identifier = trimmedLine
                        .split('|')[0]
                        .trim()
                        .toLowerCase();

                    // Kiểm tra trùng lặp trong tất cả các file chỉ khi duplicateProduct là false
                    const isDuplicate =
                        !duplicateProduct && allIdentifiersMap.has(identifier);

                    // Đánh dấu identifier đã xuất hiện (chỉ khi duplicateProduct là false)
                    if (!duplicateProduct) {
                        allIdentifiersMap.set(identifier, true);
                    }

                    // Thêm vào danh sách sẽ insert
                    productItems.push({
                        productId: productId as string,
                        dataText: trimmedLine,
                        content: null,
                        isDuplicate: isDuplicate, // Đánh dấu nếu trùng lặp
                        status: ProductItemStatus.NotSale,
                        exportedAt: null,
                        createAt: new Date().toISOString(),
                        updateAt: new Date().toISOString(),
                        serialKey: null,
                        expirationDate: null
                    });
                }

                // Cập nhật các giá trị thống kê tổng
                totalInvalidLines += invalidLines.length;
                totalValidLines += productItems.length;
                const duplicateCount = productItems.filter(
                    (item) => item.isDuplicate
                ).length;
                totalDuplicateCount += duplicateCount;


                // Insert items sử dụng adminSDK
                const itemsResult = await adminSDK.CreateMultipleProductItems({
                    objects: productItems
                });

                const itemsInserted =
                    itemsResult?.insertProductItems?.affectedRows || 0;
                totalItemsInserted += itemsInserted;

                // Create log sử dụng adminSDK
                await adminSDK.CreateProductUploadLog({
                    object: {
                        productId: productId as string,
                        userId: session.user.id,
                        fileSize: file.size,
                        fileName: file.name,
                        validRowCount: productItems.length,
                        invalidRowCount: invalidLines.length,
                        createdAt: new Date().toISOString(),
                        status: ProductUploadLogStatus.Success
                    }
                });

                uploadResults.push({
                    fileName: file.name,
                    itemsInserted,
                    totalLines: nonEmptyLines.length,
                    validLines: productItems.length,
                    invalidLines: invalidLines.length,
                    duplicateCount,
                    sampleData: productItems
                        .slice(0, 3)
                        .map((item) => item.dataText),
                    invalidSamples: invalidLines.slice(0, 3)
                });
            } catch (fileError) {
                console.error(`Error processing file ${file.name}:`, fileError);
                errors.push({
                    fileName: file.name,
                    error:
                        fileError instanceof Error
                            ? fileError.message
                            : String(fileError)
                });
            }
        }

        // Cập nhật stock_count của sản phẩm sử dụng adminSDK
        if (totalValidLines > 0) {
            const updateStockResult = await adminSDK.UpdateProductStockCount({
                productId: productId,
                incrementBy: totalValidLines
            });
        }

        // Return results
        return NextResponse.json({
            success: true,
            uploadedFiles: uploadResults,
            errors,
            totalItemsInserted,
            totalInvalidLines,
            totalDuplicateCount,
            totalValidLines,
            stockCountIncreased: totalValidLines,
            totalFiles: files.length,
            message: `Processed ${uploadResults.length} files successfully${
                errors.length ? ` with ${errors.length} errors` : ''
            }`
        });
    } catch (error) {
        console.error('General error in multiple files upload:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Files upload failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                uploadedFiles: uploadResults,
                errors
            },
            { status: 500 }
        );
    }
}
