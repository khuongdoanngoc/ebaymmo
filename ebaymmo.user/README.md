# EbayMMO - Documentation

## 1. Giới thiệu

EbayMMO là một dự án **Next.js** sử dụng **App Router**, được phát triển với mục tiêu xây dựng giao diện người dùng cho một nền tảng thương mại điện tử.

---

## 2. Công nghệ sử dụng

- **Next.js**: Framework chính
- **React.js**: Thư viện UI
- **TypeScript**: Ngôn ngữ lập trình chính
- **TailwindCSS**: Framework CSS
- **Context API**: Quản lý state toàn cục
- **Docker**: Containerization

---

## 3. Cấu trúc thư mục

```
/src
  ├── apis/              # API call utilities and configurations
  ├── app/               # Application pages and layouts
  │   ├── (account)/     # Account-related pages
  │   │   ├── layout.tsx     # Layout for account-related pages
  │   │   ├── ...pages       # Other pages related to accounts
  │   │
  │   ├── (auth)/        # Authentication-related pages
  │   │   ├── layout.tsx     # Layout for authentication pages
  │   │   ├── login          # Login page
  │   |       ├── page.tsx
  │   │   ├── register       # Register page
  │   |       ├── page.tsx
  │   │
  │   ├── (default)/     # Default pages (main structure)
  │   │   ├── layout.tsx     # Main layout
  │   │   ├── page.tsx       # Main landing page
  │   │   ├── ...pages       # Other common pages
  │   │
  │   ├── favicon.io     # Project favicon
  │   ├── globals.css    # Global styles
  │
  ├── components/        # Reusable UI components
  ├── contexts/          # Context API for global state management
  ├── guards/            # Route guards (authentication, authorization)
  ├── hooks/             # Custom React hooks
  ├── libs/              # Utility libraries and helpers

```

---

## 4. Các thành phần chính

### a. **Components**

- **Button**: Nút bấm có thể tùy chỉnh
- **CheckBox**: Ô chọn
- **Form**: Form nhập liệu
- **Modal**: Cửa sổ pop-up
- **Selected**: Dropdown lựa chọn

### b. **Contexts**

- **AuthContext**: Quản lý trạng thái đăng nhập
- **ThemeContext**: Quản lý theme tối/sáng

### c. **Guards**

- **AuthGuard**: Bảo vệ route, yêu cầu đăng nhập mới có thể truy cập
- **RoleGuard**: Kiểm tra quyền truy cập theo vai trò người dùng

### d. **Hooks**

- **useAuth()**: Hook kiểm tra trạng thái đăng nhập
- **useFetch()**: Hook gọi API tùy chỉnh

---

## 5. Cấu hình Docker

### Dockerfile

```
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

```

### docker-compose.y

```
version: '3'
services:
  shop3.user:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=develop
    command: npm run dev

```

---

## 6. Hướng dẫn chạy dự án

### a. Cài đặt

```
npm install

```

### b. Chạy dự án

```
npm run dev

```

### c. Chạy bằng Docker

```
docker-compose up --build

```

---

## 7. Tối ưu hóa (Optimization)

Dự án này bao gồm các công cụ và quy trình tối ưu hóa để cải thiện hiệu suất và trải nghiệm người dùng.

### Scripts tối ưu hóa

Các scripts tối ưu hóa được lưu trữ trong thư mục `scripts/`:

- **remove-console-logs.js**: Xóa tất cả các câu lệnh `console.log` khỏi codebase
- **optimize-images.js**: Tối ưu hóa hình ảnh trong thư mục `public/images`
- **analyze-bundle.js**: Phân tích kích thước bundle để xác định các dependencies lớn

### Chạy tối ưu hóa

```bash
# Xóa console.log
npm run remove-logs

# Tối ưu hóa hình ảnh
npm run optimize-images

# Phân tích bundle
npm run analyze
```

### Tối ưu hóa tự động

Script `prebuild` trong `package.json` tự động chạy các scripts tối ưu hóa trước khi build ứng dụng:

```bash
npm run build
```

### Các kỹ thuật tối ưu hóa đã triển khai

1. **Xóa console.log**: Tất cả các câu lệnh console.log được xóa trong môi trường production
2. **Tối ưu hóa hình ảnh**: Sử dụng Next.js Image component với các thuộc tính phù hợp
3. **Memoization**: Sử dụng useMemo và useCallback để tránh re-render không cần thiết
4. **Caching**: Sử dụng fetchPolicy phù hợp cho các GraphQL queries
5. **Code splitting**: Sử dụng dynamic imports để chia nhỏ bundle

Xem thêm thông tin chi tiết về tối ưu hóa trong [scripts/README.md](scripts/README.md).

---

## 8. Kết luận

Dự án **EbayMMO** đã được tổ chức với một kiến trúc rõ ràng, sử dụng các công nghệ tiên tiến như **Next.js, React.js, TailwindCSS, Docker** để phát triển một nền tảng thương mại điện tử mạnh mẽ.
