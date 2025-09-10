# Shop3 Functions - NestJS & Hasura Backend

## Giới thiệu

Shop3 Functions là một backend được xây dựng trên NestJS và tích hợp với Hasura GraphQL Engine. Dự án này cung cấp các API và chức năng cho hệ thống thương mại điện tử, quản lý đơn hàng, thanh toán, và các tính năng khác.

## Tính năng chính

- **Xác thực & Phân quyền**: JWT, Google OAuth
- **Quản lý sản phẩm & cửa hàng**: Thêm, sửa, xóa, tìm kiếm sản phẩm và cửa hàng
- **Quản lý đơn hàng**: Tạo, cập nhật, xử lý đơn hàng
- **Quản lý rút tiền**: Xử lý các yêu cầu rút tiền
- **Đấu giá**: Hệ thống đấu giá sản phẩm
- **Quyên góp**: Chức năng quyên góp
- **Tích hợp S3**: Lưu trữ và quản lý hình ảnh và file
- **Thông báo qua Telegram**: Tích hợp với Telegram Bot
- **Đa ngôn ngữ**: Hỗ trợ tiếng Anh và tiếng Việt
- **Logging**: Hệ thống ghi log chi tiết

## Yêu cầu hệ thống

- Node.js v18 trở lên
- npm hoặc yarn
- Docker và Docker Compose (cho môi trường phát triển)
- Hasura GraphQL Engine
- PostgreSQL (được cài đặt thông qua Docker)

## Cài đặt và Chạy

### Môi trường phát triển

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd shop3.functions
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường:**
   Sao chép file `.env.sample` thành `.env` và cập nhật các biến môi trường:
   ```bash
   cp .env.sample .env
   ```
   
   Các biến môi trường quan trọng cần cấu hình:
   - `HASURA_ENDPOINT`: Endpoint của Hasura GraphQL
   - `HASURA_GRAPHQL_ADMIN_SECRET`: Admin secret của Hasura
   - `DO_SPACES_ACCESS_KEY`, `DO_SPACES_SECRET_KEY`: Để sử dụng DigitalOcean Spaces (S3)
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: Cho xác thực Google OAuth
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: Cho chức năng gửi email
   - `TELEGRAM_BOT_TOKEN`: Token của Telegram Bot

4. **Khởi động các dịch vụ phụ thuộc:**
   ```bash
   docker-compose up -d
   ```

5. **Chạy ứng dụng ở chế độ development:**
   ```bash
   npm run dev
   ```

### Môi trường production

1. **Build Docker image:**
   ```bash
   docker build -t shop3-functions -f Dockerfile.prod .
   ```

2. **Chạy container:**
   ```bash
   docker run -p 3000:3000 --env-file .env shop3-functions
   ```

## Cấu trúc dự án

```
.
├── src/                      # Mã nguồn chính
│   ├── address-balance/      # Quản lý số dư địa chỉ
│   ├── auth/                 # Xác thực và phân quyền
│   ├── aution/               # Chức năng đấu giá
│   ├── common/               # Các tiện ích và hàm dùng chung
│   ├── complain/             # Xử lý khiếu nại
│   ├── donation/             # Chức năng quyên góp
│   ├── graphql/              # GraphQL schemas và resolvers
│   ├── mail/                 # Gửi email
│   ├── order/                # Quản lý đơn hàng
│   ├── s3/                   # Tích hợp S3
│   ├── store-ratings/        # Đánh giá cửa hàng
│   ├── stores/               # Quản lý cửa hàng
│   ├── strategies/           # Các chiến lược xác thực
│   ├── telegram/             # Tích hợp Telegram
│   ├── types/                # Các định nghĩa kiểu dữ liệu
│   ├── upload/               # Xử lý upload file
│   ├── utils/                # Các tiện ích
│   ├── withdrawal/           # Xử lý rút tiền
│   ├── app.module.ts         # Module chính
│   └── main.ts               # Entry point
├── .github/workflows/        # GitHub Actions CI/CD
├── Dockerfile                # Docker config cho development
├── Dockerfile.prod           # Docker config cho production
├── docker-compose.yml        # Cấu hình Docker Compose
└── package.json              # Cấu hình npm và dependencies
```

## GraphQL Codegen

Dự án sử dụng GraphQL Codegen để tạo TypeScript types dựa trên schema từ Hasura:

1. **Chạy lệnh tạo code:**
   ```bash
   npm run generate
   ```

2. **Cấu hình Codegen:**
   Kiểm tra file `codegen.js` để cấu hình đầu ra của quá trình tạo code.

## Linter và Formatter

- Chạy linter:
  ```bash
  npm run lint
  ```

- Chạy linter và sửa lỗi:
  ```bash
  npm run lint:fix
  ```

- Format code:
  ```bash
  npm run format
  ```

## Quy trình phát triển

1. Tạo nhánh mới từ `main` cho mỗi tính năng hoặc bug fix
2. Phát triển và test code trên nhánh đó
3. Chạy lint và format để đảm bảo code sạch sẽ
4. Tạo Pull Request vào nhánh `main`
5. Sau khi review và approve, merge PR vào `main`

## Triển khai

Dự án này được triển khai tự động thông qua GitHub Actions khi có push lên nhánh `main`. Xem file `DEPLOYMENT.md` để biết chi tiết về quy trình triển khai.

## Liên hệ

Nếu có bất kỳ câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ với team phát triển.
