#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Debug output (optional, can be removed for security)
echo "PROJECT_NAME: $PROJECT_NAME"
echo "DO_SPACES_ACCESS_KEY: $DO_SPACES_ACCESS_KEY"
echo "DO_SPACES_SECRET_KEY: $DO_SPACES_SECRET_KEY"
echo "DO_SPACES_REGION: $DO_SPACES_REGION"
echo "DO_SPACES_NAME: $DO_SPACES_NAME"
echo "HASURA_GRAPHQL_ADMIN_SECRET: $HASURA_GRAPHQL_ADMIN_SECRET"
echo "DATABASE_IP: $DATABASE_IP"

# Kiểm tra xem DATABASE_IP đã được thiết lập chưa
if [ -z "$DATABASE_IP" ]; then
    echo "Error: DATABASE_IP không được thiết lập. Vui lòng kiểm tra file .env"
    exit 1
fi

# Liệt kê tất cả các container và IP của chúng
echo "Danh sách các container và IP của chúng:"
docker ps --format "{{.ID}} - {{.Names}}" | while read container; do
    CONTAINER_ID=$(echo $container | awk '{print $1}')
    CONTAINER_NAME=$(echo $container | awk '{print $3}')
    IP_ADDRESSES=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}' $CONTAINER_ID)
    echo "$CONTAINER_ID - $CONTAINER_NAME - IP: $IP_ADDRESSES"
done

# Tìm kiếm container database dựa trên DATABASE_IP chính xác
CONTAINER_ID=$(docker ps -q | xargs docker inspect --format '{{.Id}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | grep -w "${DATABASE_IP}" | awk '{print $1}')

# Kiểm tra xem có tìm thấy container không
if [ -z "$CONTAINER_ID" ]; then
    echo "Error: Không tìm thấy container database với IP: ${DATABASE_IP}"
    exit 1
fi

echo "Đã tìm thấy container ID: $CONTAINER_ID với IP: ${DATABASE_IP}"

# Database credentials (replace these with your actual values or use environment variables)
POSTGRES_USER="postgres"
POSTGRES_DATABASE="postgres"

# Dump file name
DUMP_FILE="dump.sql"

# Run pg_dump inside the container
docker exec -t $CONTAINER_ID pg_dump -U $POSTGRES_USER -d $POSTGRES_DATABASE > $DUMP_FILE

# Optional: Get current date and time for file naming
CURRENT_DATETIME=$(date +"%Y%m%d%H%M")
DUMP_FILE_CLOUD="${CURRENT_DATETIME}_dump.sql"

# Upload the dump file to DigitalOcean Spaces with the date prefix
s3cmd --access_key=$DO_SPACES_ACCESS_KEY \
      --secret_key=$DO_SPACES_SECRET_KEY \
      --host=$DO_SPACES_REGION.digitaloceanspaces.com \
      --host-bucket="%(bucket)s.$DO_SPACES_REGION.digitaloceanspaces.com" \
      put "$DUMP_FILE" s3://$DO_SPACES_NAME/$PROJECT_NAME/$DUMP_FILE_CLOUD

echo "Database dump uploaded to DigitalOcean Spaces: $DUMP_FILE_CLOUD"

# Kiểm tra hệ điều hành và thiết lập lệnh date phù hợp
if command -v gdate &> /dev/null; then
    DATE_CMD="gdate"
else
    DATE_CMD="date"
fi

# Lấy ngày hiện tại dưới dạng giây từ epoch
CURRENT_DATE=$($DATE_CMD +%s)
DAYS_LIMIT=5

# Liệt kê tất cả các file trong bucket và xử lý từng file
s3cmd --access_key=$DO_SPACES_ACCESS_KEY \
      --secret_key=$DO_SPACES_SECRET_KEY \
      --host=$DO_SPACES_REGION.digitaloceanspaces.com \
      --host-bucket="%(bucket)s.$DO_SPACES_REGION.digitaloceanspaces.com" \
      ls s3://$DO_SPACES_NAME/$PROJECT_NAME/ | grep -v 'DIR' | while read -r line; do
    # Trích xuất tên file và ngày tháng
    FILE_NAME=$(echo $line | awk '{print $4}')
    FILE_DATE=$(echo $line | awk '{print $1 " " $2}')

    # Chuyển đổi ngày tháng của file thành giây từ epoch
    if [ "$DATE_CMD" = "gdate" ]; then
        FILE_DATE_SECONDS=$($DATE_CMD -d "$FILE_DATE" +%s)
    else
        FILE_DATE_SECONDS=$(date -d "$FILE_DATE" +%s)
    fi

    # Tính tuổi của file theo ngày
    AGE_IN_DAYS=$(( (CURRENT_DATE - FILE_DATE_SECONDS) / (60 * 60 * 24) ))

    # Kiểm tra nếu file cũ hơn giới hạn
    if [ "$AGE_IN_DAYS" -gt "$DAYS_LIMIT" ]; then
        echo "Deleting $FILE_NAME (age: $AGE_IN_DAYS days)"
        s3cmd --access_key=$DO_SPACES_ACCESS_KEY \
              --secret_key=$DO_SPACES_SECRET_KEY \
              --host=$DO_SPACES_REGION.digitaloceanspaces.com \
              --host-bucket="%(bucket)s.$DO_SPACES_REGION.digitaloceanspaces.com" \
              del "$FILE_NAME"
    fi
done

echo "Cleanup completed."
