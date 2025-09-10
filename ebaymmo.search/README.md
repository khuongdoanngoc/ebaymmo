## Overview

This project implements a search functionality using Elasticsearch for the shop3 system. It provides a set of APIs to handle search operations and data synchronization between the main database and Elasticsearch.

## Features

- Full-text search capabilities powered by Elasticsearch
- Automatic data synchronization with Hasura triggers
- Real-time indexing of store data
- Scalable and high-performance search operations

## Installation

To set up the project locally, follow these steps:

1. **Prerequisites**: Ensure you have Node.js and npm installed on your machine.
2. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```
3. **Navigate to the project directory**:
   ```bash
   cd shop3.search
   ```
4. **Environment Setup**:

   - Create a `.env` file based on `.env.sample`
   - In the `shop3.hasura` repository's `.env` file, add the following configurations:
     ```
     SEARCH_IP=10.0.8.9
     SEARCH_URL=http://${SEARCH_IP}:3004
     ```

5. **Hasura Trigger Setup**:

   - Access Hasura Console
   - Create a trigger to monitor the `stores` table
   - Set the trigger URL to: `{{SEARCH_URL}}/elasticsearch-sync/store`

6. **Install dependencies and generate files**:

   ```bash
   npm install
   npm run generate
   ```

7. **Start the services**:
   ```bash
   dcup -d
   ```

## Important Notes

- Data synchronization from the main database to Elasticsearch occurs every midnight by default
- The service maintains search indices for store data
- Search operations are optimized for performance and relevancy
- To modify the sync interval, locate the following code in `elasticsearch.service.ts`:
  ```typescript
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  ```
  And change it to:
  ```typescript
  @Cron(CronExpression.EVERY_MINUTE)
  ```
  if you need more frequent synchronization.

## Usage

To start the search service, run:

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.

## Contact

For any questions or support, please contact [Your Name] at [Your Email].
