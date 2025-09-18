#### Created and Maintained by Roney Dsilva

# Redis Tools <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/database-solid.svg" width="30" height="30" alt="Redis Tools">

This SC Module provides a set of Redis-related tools for various operations, including data insertion, data retrieval, checking the Redis server's status, and inserting log data into Redis. These tools are designed to be used in Node.js applications and are optimized for robust error handling and clear parameter validation.

## Table of Contents

- [Redis Insert Data](#redis-insert-data)
- [Redis Fetch Data](#redis-fetch-data)
- [Redis Delete Data](#redis-delete-data)
- [Check Redis](#check-redis)
- [Redis Insert Log](#redis-insert-log)
- [Error Handling](#error-handling)

## Redis Insert Data <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/upload-solid.svg" width="30" height="30" alt="Redis Insert Data Icon">

### Description

Insert data into a Redis database under a specified key.

### Input Parameters

- **Name**: A unique name for this operation.
- **Key**: The key under which the data should be inserted in Redis.
- **Data**: The data to be inserted into Redis (should be a valid JSON string or object).

### Output

- **Output**: `{ success: true }` if the operation was successful, or an error if not.

## Redis Fetch Data <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/download-solid.svg" width="30" height="30" alt="Redis Fetch Data Icon">

### Description

Fetch data from a Redis database by key.

### Input Parameters

- **Name**: A unique name for this operation.
- **Key**: The key from which data should be retrieved in Redis.

### Output

- **Output**: The retrieved data from Redis. If the data is JSON, it will be parsed and returned as an object; otherwise, the raw string is returned.

## Redis Delete Data <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/trash-solid.svg" width="30" height="30" alt="Redis Delete Data Icon">

### Description

Delete data from a Redis database by key.

### Input Parameters

- **Name**: A unique name for this operation.
- **Key**: The key to delete from Redis.

### Output

- **Output**: `{ success: true, deleted: <number> }` where `deleted` indicates the number of keys that were deleted (0 if key didn't exist, 1 if key was deleted), or an error if the operation failed.

## Check Redis <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/heartbeat-solid.svg" width="30" height="30" alt="Check Redis Icon">

### Description

Check the status of a Redis server (PING with timeout).

### Input Parameters

- **Name**: A unique name for this operation.
- **Timeout**: Timeout in milliseconds for the server check (default: 5000ms).

### Output

- **Output**: The result of the PING command (usually 'PONG'), or an error if the server is unavailable or times out.

## Redis Insert Log <img src="https://github.com/seanyeh/fontawesome-svgs/raw/master/svg/save-solid.svg" width="30" height="30" alt="Redis Insert Log Icon">

### Description

Insert structured log data into a Redis list for later analysis or auditing.

### Input Parameters

- **Name**: A unique name for this operation.
- **Key**: The key (list) under which the log data should be inserted in Redis.
- **Timestamp**: Timestamp for the log entry.
- **Log Level**: The log level (e.g., info, error).
- **ID**: The ID for grouping events.
- **Event**: Event description.
- **Type**: Type or action name of the event.
- **User ID**: User ID from the provider.
- **Message**: The log message.
- **Domain**: Domain name.
- **System**: System type.
- **Session ID**: Session identifier.
- **Transaction ID**: (Optional) Transaction identifier.
- **Message Context**: (Optional) Additional details as a JSON object or string.
- **Is Note?**: (Optional) Mark entry as a note.
- **Property Key**: (Optional) Additional property key.
- **Property Value**: (Optional) Additional property value.

### Output

- **Output**: `{ success: true }` if the log was inserted successfully, or an error if not.

## Error Handling

All Redis operations are wrapped in robust error handling. If an operation fails (e.g., invalid parameters, Redis unavailable, timeout), a clear error message is logged and thrown. Always check for errors in your integration and handle them appropriately.

## Module Usage

- All tools require a running Redis server and proper environment configuration (see `REDIS_HOST`, `REDIS_PORT`, etc.).
- All parameters are validated before execution. Invalid or missing parameters will result in an error.
- Data is automatically stringified and parsed as JSON where appropriate.
