#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if variables are set
if [ -z "$MONGO_PORT" ] || [ -z "$MONGO_INITDB_ROOT_USERNAME" ] || [ -z "$MONGO_INITDB_ROOT_PASSWORD" ]; then
  echo "One or more environment variables are not set. Please check your .env file."
  exit 1
fi

MONGO_HOST="localhost"
MONGO_PORT="${MONGO_PORT}"
MONGO_USER="${MONGO_INITDB_ROOT_USERNAME}"
MONGO_PASS="${MONGO_INITDB_ROOT_PASSWORD}"
BACKUP_DIR="backup"

# Tìm kiếm container database dựa trên DATABASE_IP
CONTAINER_ID=$(docker ps -q | xargs docker inspect --format '{{.Id}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' | grep ${MONGO_IP} | awk '{print $1}')

# Kiểm tra xem có tìm thấy container không
if [ -z "$CONTAINER_ID" ]; then
    echo "Error: Không tìm thấy container database."
    exit 1
elif [ $(echo "$CONTAINER_ID" | wc -l) -gt 1 ]; then
    echo "Warning: Tìm thấy nhiều container database. Bỏ qua thao tác."
    exit 1
fi

echo "Đã tìm thấy container ID: $CONTAINER_ID"

# Perform backup using docker exec
docker exec $CONTAINER_ID mongodump --host "${MONGO_HOST}" --port "${MONGO_PORT}" --username "${MONGO_USER}" --password "${MONGO_PASS}" --out "/data/backup"

# Copy the backup from the container to the host
docker cp $CONTAINER_ID:/data/backup "${BACKUP_DIR}"

# Optional: Get current date and time for file naming
CURRENT_DATETIME=$(date +"%Y%m%d%H%M")
DUMP_FILE_CLOUD="${CURRENT_DATETIME}_backup.tar.gz"

# Compress the backup directory
tar -czf "${DUMP_FILE_CLOUD}" "${BACKUP_DIR}"

# Upload the dump file to DigitalOcean Spaces
s3cmd --access_key=$DO_SPACES_ACCESS_KEY \
      --secret_key=$DO_SPACES_SECRET_KEY \
      --host=$DO_SPACES_REGION.digitaloceanspaces.com \
      --host-bucket="%(bucket)s.$DO_SPACES_REGION.digitaloceanspaces.com" \
      put "${DUMP_FILE_CLOUD}" s3://$DO_SPACES_NAME/$PROJECT_NAME/

echo "Backup uploaded to DigitalOcean Spaces: ${DUMP_FILE_CLOUD}"

# Cleanup old backups in DigitalOcean Spaces
# ... existing code ...

# Delete the backup directory and tar file
rm -rf "${BACKUP_DIR}"
rm -f "${DUMP_FILE_CLOUD}"

echo "Backup directory and tar file have been deleted."