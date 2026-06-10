import { existsSync, readFileSync } from "node:fs";
import { createServer, ServerResponse } from "node:http";
import { resolve } from "node:path";

import { handleMazeCoachRoute } from "./routes/mazeCoach.js";

loadEnvFile();

const port = Number(process.env.PORT ?? 8787);

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

  if (path === "/health") {
    writeJson(res, 200, { ok: true, service: "maze-method-backend" });
    return;
  }

  if (path === "/api/maze-coach/recommendation") {
    await handleMazeCoachRoute(req, res);
    return;
  }

  writeJson(res, 404, { error: "Route not found." });
});

server.listen(port, () => {
  console.log(`Maze Method backend running on http://localhost:${port}`);
});

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function writeJson(res: ServerResponse, statusCode: number, value: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}

function loadEnvFile() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "backend", ".env")];
  const envPath = candidates.find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
