import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers for copyright protection
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Copyright", "© 2025 Katmannames - All Rights Reserved");
  res.setHeader("X-Protected-By", "Katmannames Security System");
  next();
});

// API log middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err); // hata stack’ini konsola da yaz
  });

  // Development → Vite HMR, Production → static files
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // PORT & HOST ayarları (Replit + yerel makine uyumlu)
  const port = parseInt(process.env.PORT || "5000", 10);

  // Replit’te PORT tanımlıysa → host "0.0.0.0" olmalı
  // Yerel makinede → localhost yeterli ve ENOTSUP hatası vermez
  const host = process.env.PORT ? "0.0.0.0" : "localhost";

  server.listen(port, host, () => {
    if (process.env.PORT) {
      log(`Server Replit modunda port ${port}'da çalışıyor`);
    } else {
      log(`Server http://localhost:${port} adresinde çalışıyor`);
      log(`Development modunda isen: http://localhost:${port}`);
    }
  });
})();