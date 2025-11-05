# MongoDB Hyperdrive Cloudflare Worker - Todo CRUD API

A Cloudflare Worker that uses MongoDB with Hyperdrive for persistent connections and itty-router for routing.

## Features

- ✅ Full CRUD operations for todos
- ✅ MongoDB persistent connections via Hyperdrive
- ✅ Lightweight routing with itty-router
- ✅ CORS enabled
- ✅ Error handling and validation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Hyperdrive

First, create a Hyperdrive configuration in Cloudflare:

```bash
# Create Hyperdrive configuration
wrangler hyperdrive create my-mongodb \
  --connection-string="mongodb+srv://username:password@cluster.mongodb.net/database"
```

Copy the Hyperdrive ID from the output and update `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id-here"
```

### 3. Deploy

```bash
# Deploy to production
wrangler deploy

# Or run locally
wrangler dev
```

## API Endpoints

### Get All Todos
```bash
GET /todos
```

### Get Todo by ID
```bash
GET /todos/:id
```

### Create Todo
```bash
POST /todos
Content-Type: application/json

{
  "title": "My Todo",
  "description": "Optional description",
  "completed": false
}
```

### Update Todo
```bash
PUT /todos/:id
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true
}
```

### Delete Todo
```bash
DELETE /todos/:id
```

## Example Usage

```bash
# Create a todo
curl -X POST https://your-worker.workers.dev/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Cloudflare Workers", "description": "Build a MongoDB API"}'

# Get all todos
curl https://your-worker.workers.dev/todos

# Update a todo
curl -X PUT https://your-worker.workers.dev/todos/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a todo
curl -X DELETE https://your-worker.workers.dev/todos/507f1f77bcf86cd799439011
```

## Configuration

Edit `wrangler.toml` to customize:

- `DATABASE_NAME`: MongoDB database name (default: "todoDB")
- `COLLECTION_NAME`: MongoDB collection name (default: "todos")
- Hyperdrive binding ID

## Notes

- Hyperdrive provides connection pooling and reduces latency for MongoDB connections
- The worker caches the MongoDB client for reuse across requests
- All responses include CORS headers for cross-origin requests
