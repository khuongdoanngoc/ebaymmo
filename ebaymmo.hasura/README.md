# Shop3 Hasura

## Overview

Shop3 Hasura is a project that leverages Hasura's GraphQL engine to provide a robust backend service. It integrates with a PostgreSQL database and Redis for caching, all orchestrated using Docker.

## Project Structure

- **`docker-compose.yml`**: Defines the services for the project, including the database, Hasura, and Redis.
- **`Dockerfile.pg_cron`**: Custom Dockerfile for the PostgreSQL database with `pg_cron` extension.
- **`backup.sh` & `restore.sh`**: Scripts for backing up and restoring the database.
- **`migrations/`**: Directory for database migration files.
- **`seeds/`**: Directory for database seed files.
- **`metadata/`**: Contains Hasura metadata files.
- **`.env` & `.env.sample`**: Environment variable files for configuration.

## Services

- **Database**: A PostgreSQL database with `pg_cron` for scheduled tasks.
- **Hasura**: GraphQL engine for providing a real-time API.
- **Redis**: In-memory data structure store, used as a database, cache, and message broker.

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd shop3.hasura
   ```

2. **Configure environment variables**:
   - Copy `.env.sample` to `.env` and update the necessary variables.

3. **Start the services**:
   ```bash
   docker-compose up -d
   ```

4. **Access Hasura Console**:
   - Open your browser and go to `http://localhost:<HASURA_PORT>`

## Backup and Restore

- **Backup**:
  ```bash
  ./backup.sh
  ```

- **Restore**:
  ```bash
  ./restore.sh
  ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
