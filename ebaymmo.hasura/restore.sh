#!/bin/bash

# Hàm xác nhận từ người dùng
confirm() {
    read -r -p "$1 (Y/N): " response
    case "$response" in
        [yY])
            true
            ;;
        *)
            false
            ;;
    esac
}

# Yêu cầu người dùng chọn phương thức khôi phục
echo "Chọn phương thức khôi phục:"
echo "1. Khôi phục từ file dump.sql có sẵn"
echo "2. Nhập URL để tải file dump"
read -p "Nhập lựa chọn (1 hoặc 2): " choice

if [ "$choice" -eq 1 ]; then
    DUMP_FILE="dump.sql"
    if [ ! -f "$DUMP_FILE" ]; then
        echo "Error: Không tìm thấy file dump.sql!"
        exit 1
    fi
elif [ "$choice" -eq 2 ]; then
    read -p "Nhập URL để tải file dump: " DUMP_URL
    curl -o dump.sql "$DUMP_URL"
    DUMP_FILE="dump.sql"
    # Kiểm tra sự tồn tại của file dump.sql
    if [ ! -f "$DUMP_FILE" ]; then
        echo "Error: Không thể tải file dump.sql!"
        exit 1
    fi
else
    echo "Error: Lựa chọn không hợp lệ!"
    exit 1
fi

# Yêu cầu xác nhận trước khi tiếp tục
if confirm "Bạn có chắc chắn muốn khôi phục database từ file $DUMP_FILE?"; then
    echo "Xác nhận thành công."
else
    echo "Khôi phục database đã bị hủy."
    exit 1
fi

# Đọc PROJECT_NAME và DATABASE_IP từ file .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v 'HASURA_GRAPHQL_JWT_SECRET' | xargs)
else
    echo "Error: Không tìm thấy file .env"
    exit 1
fi

# Tìm kiếm container database dựa trên DATABASE_IP
CONTAINER_ID=$(docker ps -q | xargs docker inspect --format '{{.Id}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | grep ${DATABASE_IP} | awk '{print $1}')

if [ -z "$CONTAINER_ID" ]; then
    echo "Error: Không tìm thấy container database cho project ${PROJECT_NAME} với IP ${DATABASE_IP}."
    exit 1
elif [ $(echo "$CONTAINER_ID" | wc -l) -gt 1 ]; then
    echo "Warning: Tìm thấy nhiều container database cho project ${PROJECT_NAME} với IP ${DATABASE_IP}. Bỏ qua thao tác."
    exit 1
fi

echo "Đã tìm thấy container ID: $CONTAINER_ID"

# Thông tin đăng nhập database (cần thay đổi nếu cần thiết)
POSTGRES_USER="postgres"
POSTGRES_DATABASE="postgres"
DUMP_FILE="dump.sql" # Đảm bảo dump.sql có trong thư mục hiện tại

# Kiểm tra sự tồn tại của file dump.sql
if [ ! -f "$DUMP_FILE" ]; then
    echo "Error: Không tìm thấy file dump.sql!"
    exit 1
fi

# Sao chép file dump.sql vào trong container
docker cp $DUMP_FILE $CONTAINER_ID:/tmp/$DUMP_FILE

# Xóa schema hiện tại và khôi phục lại từ file dump
docker exec -t $CONTAINER_ID psql -U $POSTGRES_USER -d $POSTGRES_DATABASE -c "DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all schemas
    FOR r IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')) 
    LOOP
        EXECUTE 'DROP SCHEMA ' || quote_ident(r.schema_name) || ' CASCADE';
    END LOOP;
END \$\$;"

docker exec -t $CONTAINER_ID psql -U $POSTGRES_USER -d $POSTGRES_DATABASE -c "CREATE SCHEMA IF NOT EXISTS hdb_catalog;"
docker exec -t $CONTAINER_ID psql -U $POSTGRES_USER -d $POSTGRES_DATABASE -c "CREATE SCHEMA IF NOT EXISTS public;"

# Khôi phục database từ file dump
docker exec -t $CONTAINER_ID psql -U $POSTGRES_USER -d $POSTGRES_DATABASE -f /tmp/$DUMP_FILE

# Xóa file dump trong container sau khi khôi phục xong
docker exec -t $CONTAINER_ID rm /tmp/$DUMP_FILE

echo "Khôi phục database hoàn tất, dữ liệu cũ đã bị ghi đè."
hasura metadata reload
