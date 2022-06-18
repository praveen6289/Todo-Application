const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    //Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS'
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo LIKE "%${search_q}%"
                    AND priority="${priority}"
                    AND status="${status}";`;
      break;
    //Returns a list of all todos whose priority is 'HIGH'
    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE "%${search_q}%"
                    AND priority="${priority}";`;
      break;
    //Returns a list of all todos whose status is 'TO DO'
    case hasStatusProperty(request.query):
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE "%${search_q}%"
                    AND status="${status}";`;
      break;
    //Returns a list of all todos whose todo contains 'Play' text
    default:
      getTodosQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE "%${search_q}%";`;
      break;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE
            id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
            DELETE FROM
                todo
            WHERE 
                id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
