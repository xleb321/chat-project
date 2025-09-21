import fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({ logger: true });

// Schema для переменных окружения
const envSchema = {
  type: "object",
  required: ["PORT", "JWT_SECRET"],
  properties: {
    PORT: { type: "string", default: "10000" },
    JWT_SECRET: { type: "string", default: "your_fallback_secret_key_here" },
    DB_PATH: { type: "string", default: "./database.json" },
  },
};

// База данных (простая JSON база)
class Database {
  constructor(path) {
    this.path = path;
    this.data = { users: [], messages: [], friendships: [] };
  }

  async load() {
    try {
      const content = await fs.readFile(this.path, "utf8");
      this.data = JSON.parse(content);
    } catch (error) {
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(this.path, JSON.stringify(this.data, null, 2));
  }
}

// Middleware для аутентификации
async function authenticate(request, reply) {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, server.config.JWT_SECRET);
    request.user = decoded;
  } catch (error) {
    reply.code(401).send({ error: "Unauthorized" });
  }
}

// WebSocket connections
const connections = new Map();

async function startServer() {
  try {
    // Регистрируем плагины
    await server.register(fastifyEnv, {
      schema: envSchema,
      dotenv: true,
    });

    await server.register(fastifyCors, {
      origin: true,
    });

    await server.register(fastifyWebsocket);

    const db = new Database(server.config.DB_PATH);
    await db.load();

    // Регистрация
    server.post("/register", async (request, reply) => {
      const { username, password, email } = request.body;

      if (db.data.users.find(u => u.username === username)) {
        return reply.code(400).send({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      db.data.users.push(user);
      await db.save();

      const token = jwt.sign({ id: user.id, username: user.username }, server.config.JWT_SECRET);

      reply.send({
        token,
        user: { id: user.id, username: user.username },
      });
    });

    // Логин
    server.post("/login", async (request, reply) => {
      const { username, password } = request.body;

      const user = db.data.users.find(u => u.username === username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, server.config.JWT_SECRET);

      reply.send({
        token,
        user: { id: user.id, username: user.username },
      });
    });

    // Получение списка друзей
    server.get("/friends", { preHandler: authenticate }, async (request, reply) => {
      const userFriends = db.data.friendships
        .filter(f => f.userId === request.user.id && f.status === "accepted")
        .map(f => {
          const friend = db.data.users.find(u => u.id === f.friendId);
          return { id: friend.id, username: friend.username };
        });

      reply.send({ friends: userFriends });
    });

    // Добавление друга
    server.post("/friends", { preHandler: authenticate }, async (request, reply) => {
      const { friendUsername } = request.body;

      const friend = db.data.users.find(u => u.username === friendUsername);
      if (!friend) {
        return reply.code(404).send({ error: "User not found" });
      }

      const existingFriendship = db.data.friendships.find(f => f.userId === request.user.id && f.friendId === friend.id);

      if (existingFriendship) {
        return reply.code(400).send({ error: "Already friends" });
      }

      const friendship = {
        id: uuidv4(),
        userId: request.user.id,
        friendId: friend.id,
        status: "accepted",
        createdAt: new Date().toISOString(),
      };

      db.data.friendships.push(friendship);
      await db.save();

      reply.send({
        friend: { id: friend.id, username: friend.username },
      });
    });

    // WebSocket для чата
    server.get("/ws", { websocket: true }, (connection, request) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      try {
        const user = jwt.verify(token, server.config.JWT_SECRET);
        connections.set(user.id, connection);

        server.log.info(`User ${user.username} connected`);

        connection.socket.on("message", message => {
          try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
              case "message":
                const messageData = {
                  id: uuidv4(),
                  from: user.id,
                  to: data.to,
                  content: data.content,
                  timestamp: new Date().toISOString(),
                };

                db.data.messages.push(messageData);
                db.save();

                // Отправка сообщения получателю
                if (connections.has(data.to)) {
                  connections.get(data.to).socket.send(
                    JSON.stringify({
                      type: "message",
                      data: {
                        ...messageData,
                        from: user.username,
                      },
                    })
                  );
                }
                break;
            }
          } catch (error) {
            server.log.error("WebSocket message error:", error);
          }
        });

        connection.socket.on("close", () => {
          connections.delete(user.id);
          server.log.info(`User ${user.username} disconnected`);
        });
      } catch (error) {
        connection.socket.close();
      }
    });

    // Запуск сервера
    await server.ready();

    server.listen(
      {
        port: server.config.PORT,
        host: "0.0.0.0",
      },
      err => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        server.log.info(`Server running on port ${server.config.PORT}`);
      }
    );
  } catch (error) {
    server.log.error("Server startup error:", error);
    process.exit(1);
  }
}

startServer();
