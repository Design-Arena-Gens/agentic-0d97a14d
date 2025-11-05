import { Router, json, error } from 'itty-router';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection cache
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(env) {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Use Hyperdrive connection string
  const connectionString = env.HYPERDRIVE.connectionString;

  const client = new MongoClient(connectionString, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db(env.DATABASE_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function getCollection(db, collectionName) {
  return db.collection(collectionName);
}

const router = Router();

// CORS middleware
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check
router.get('/', () =>
  json({
    message: 'MongoDB Hyperdrive Todo API',
    endpoints: {
      'GET /todos': 'Get all todos',
      'GET /todos/:id': 'Get todo by ID',
      'POST /todos': 'Create new todo',
      'PUT /todos/:id': 'Update todo',
      'DELETE /todos/:id': 'Delete todo'
    }
  }, { headers: corsHeaders })
);

// Get all todos
router.get('/todos', async (request, env) => {
  try {
    const { db } = await connectToDatabase(env);
    const collection = getCollection(db, env.COLLECTION_NAME);

    const todos = await collection.find({}).toArray();

    return json({
      success: true,
      count: todos.length,
      data: todos
    }, { headers: corsHeaders });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Get todo by ID
router.get('/todos/:id', async (request, env) => {
  try {
    const { id } = request.params;

    if (!ObjectId.isValid(id)) {
      return json({
        success: false,
        error: 'Invalid ID format'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const { db } = await connectToDatabase(env);
    const collection = getCollection(db, env.COLLECTION_NAME);

    const todo = await collection.findOne({ _id: new ObjectId(id) });

    if (!todo) {
      return json({
        success: false,
        error: 'Todo not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return json({
      success: true,
      data: todo
    }, { headers: corsHeaders });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Create new todo
router.post('/todos', async (request, env) => {
  try {
    const body = await request.json();

    if (!body.title) {
      return json({
        success: false,
        error: 'Title is required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const { db } = await connectToDatabase(env);
    const collection = getCollection(db, env.COLLECTION_NAME);

    const newTodo = {
      title: body.title,
      description: body.description || '',
      completed: body.completed || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newTodo);

    const insertedTodo = await collection.findOne({ _id: result.insertedId });

    return json({
      success: true,
      data: insertedTodo
    }, {
      status: 201,
      headers: corsHeaders
    });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Update todo
router.put('/todos/:id', async (request, env) => {
  try {
    const { id } = request.params;

    if (!ObjectId.isValid(id)) {
      return json({
        success: false,
        error: 'Invalid ID format'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();

    const { db } = await connectToDatabase(env);
    const collection = getCollection(db, env.COLLECTION_NAME);

    const updateFields = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.completed !== undefined) updateFields.completed = body.completed;
    updateFields.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return json({
        success: false,
        error: 'Todo not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return json({
      success: true,
      data: result
    }, { headers: corsHeaders });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});

// Delete todo
router.delete('/todos/:id', async (request, env) => {
  try {
    const { id } = request.params;

    if (!ObjectId.isValid(id)) {
      return json({
        success: false,
        error: 'Invalid ID format'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const { db } = await connectToDatabase(env);
    const collection = getCollection(db, env.COLLECTION_NAME);

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return json({
        success: false,
        error: 'Todo not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return json({
      success: true,
      message: 'Todo deleted successfully'
    }, { headers: corsHeaders });
  } catch (err) {
    return json({
      success: false,
      error: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});

// 404 handler
router.all('*', () =>
  json({
    success: false,
    error: 'Route not found'
  }, {
    status: 404,
    headers: corsHeaders
  })
);

export default {
  async fetch(request, env, ctx) {
    return router.fetch(request, env, ctx).catch(err =>
      json({
        success: false,
        error: err.message
      }, {
        status: 500,
        headers: corsHeaders
      })
    );
  }
};
