import { onRequest } from "firebase-functions/v2/https";
import cors from "cors";
import https from "https";
import type { IncomingHttpHeaders } from "http";
import { URL } from "url";

type TransformContext = {
  headers: Record<string, string>;
  body: unknown;
  method: string;
};

type TransformResult = {
  path: string;
  method?: string;
  body?: unknown;
};

const corsMiddleware = cors({ origin: true });

const DEFAULT_COMPANY_AUTH_ID =
  process.env.COMPANY_AUTH_ID || "xudQREZBrfGdw0ag8tE3NR3XhM6LGa";
const DEFAULT_ID_DATA = process.env.ID_DATA || "14";

const extractAuthPayload = (headers: Record<string, string>) => ({
  companyAuthId: headers["companyauthid"] || DEFAULT_COMPANY_AUTH_ID,
  idData: headers["iddata"] || DEFAULT_ID_DATA,
});

type CandidateBuilder = (context: TransformContext) => TransformResult[];

const candidateBuilders: Record<string, CandidateBuilder> = {
  "/events/getrooms": ({ headers, method }) => [
    { path: "/events/getrooms", method },
    {
      path: "/GetRooms",
      method: "POST",
      body: extractAuthPayload(headers),
    },
  ],
  "/events/getservices": ({ headers, body, method }) => {
    const baseBody =
      typeof body === "object" && body !== null ? body : undefined;
    const fallbackBody = {
      services: {
        serviceName: "",
      },
      ...(baseBody ?? {}),
      ...extractAuthPayload(headers),
    };
    return [
      { path: "/events/getservices", method, body: baseBody },
      { path: "/GetServices", method: "POST", body: fallbackBody },
    ];
  },
  "/events": ({ headers, body, method }) => {
    const baseBody =
      typeof body === "object" && body !== null ? body : undefined;
    const fallbackBody = {
      ...extractAuthPayload(headers),
      ...(baseBody ?? {}),
    };
    return [
      { path: "/events", method, body: baseBody },
      { path: "/GetEvents", method: "POST", body: fallbackBody },
    ];
  },
};

// URL base del API remoto
const REMOTE_API_BASE =
  process.env.VITE_API_BASE ||
  "https://grupoheroicaapi.skillsuite.net/app/wssuite/api";

// Función HTTP gen2 que hace de proxy para /api/*
export const proxyApiV2 = onRequest(
  {
    cors: true,
    maxInstances: 10,
    region: "us-central1",
  },
  async (req, res) => {
    // Gen2 maneja CORS automáticamente, pero usamos middleware por compatibilidad
    corsMiddleware(req, res, async () => {
      try {
        // SOLUCIÓN DEFINITIVA: Firebase Hosting con rewrite a función gen1 causa que
        // la URL llegue con prefijo /proxyApi. En lugar de parsear, simplemente
        // tomamos el último segmento útil de la ruta.
        const originalPath = (req as any).path || req.url || "";

        // Extraer todos los segmentos de la ruta
        const segments = String(originalPath)
          .split("/")
          .filter((s) => s.length > 0);

        // Buscar el último segmento que NO sea 'proxyApi' ni 'api'
        // Ejemplo: /proxyApi/api/authenticate -> segmentos: [proxyApi, api, authenticate] -> authenticate
        const meaningfulSegments = segments.filter(
          (s) => s !== "proxyApi" && s !== "api"
        );

        // Construir la ruta final
        let forwardedPath =
          meaningfulSegments.length > 0
            ? "/" + meaningfulSegments.join("/")
            : "/";

        const headers: Record<string, string> = {};
        const allowedHeaders = [
          "content-type",
          "accept",
          "authorization",
          "iddata",
          "companyauthid",
        ];
        for (const headerName of allowedHeaders) {
          const value = req.headers[headerName];
          if (typeof value === "string" && value.length > 0) {
            headers[headerName] = value;
          }
        }

        if (!headers["accept"]) {
          headers["accept"] = "application/json, text/plain";
        }

        let parsedBody: unknown;
        if (req.method !== "GET" && req.method !== "HEAD") {
          if ((req as any).body && Object.keys((req as any).body).length) {
            parsedBody = (req as any).body;
          } else if ((req as any).rawBody) {
            const raw = (req as any).rawBody;
            try {
              parsedBody = JSON.parse(raw.toString());
            } catch (error) {
              parsedBody = raw.toString();
            }
          }
        }

        const normalizedPath = forwardedPath.toLowerCase();
        const context: TransformContext = {
          headers,
          body: parsedBody,
          method: req.method,
        };

        const candidates = candidateBuilders[normalizedPath]
          ? candidateBuilders[normalizedPath](context)
          : [
              {
                path: forwardedPath,
                method: req.method,
                body: parsedBody,
              },
            ];

        let remoteResponse: {
          status: number;
          headers: IncomingHttpHeaders;
          body: Buffer;
        } | null = null;
        let responsePath = forwardedPath;
        let lastError: unknown = null;
        let lastTargetUrl = `${REMOTE_API_BASE}${forwardedPath}`;

        for (let index = 0; index < candidates.length; index += 1) {
          const candidate = candidates[index];
          responsePath = candidate.path;
          const method = (candidate.method || req.method).toUpperCase();
          const attemptHeaders: Record<string, string> = { ...headers };

          let attemptBody: unknown = candidate.body;
          if (attemptBody === undefined) {
            attemptBody = parsedBody;
          }

          let serializedBody: string | undefined;
          if (
            attemptBody !== undefined &&
            method !== "GET" &&
            method !== "HEAD"
          ) {
            serializedBody =
              typeof attemptBody === "string"
                ? attemptBody
                : JSON.stringify(attemptBody);
            if (!attemptHeaders["content-type"]) {
              attemptHeaders["content-type"] = "application/json";
            }
          }

          const targetUrl = `${REMOTE_API_BASE}${candidate.path}`;
          lastTargetUrl = targetUrl;

          try {
            console.info("proxy: forwarding", {
              originalPath,
              attempt: index + 1,
              targetPath: candidate.path,
              targetUrl,
              method,
            });

            const url = new URL(targetUrl);
            const requestOptions: https.RequestOptions = {
              protocol: url.protocol,
              hostname: url.hostname,
              port: url.port
                ? Number(url.port)
                : url.protocol === "https:"
                ? 443
                : 80,
              path: url.pathname + url.search,
              method,
              headers: {
                ...attemptHeaders,
                host: url.hostname,
              },
            };

            remoteResponse = await new Promise<{
              status: number;
              headers: IncomingHttpHeaders;
              body: Buffer;
            }>((resolve, reject) => {
              const request = https.request(requestOptions, (response) => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk) => {
                  chunks.push(
                    Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
                  );
                });
                response.on("end", () => {
                  resolve({
                    status: response.statusCode || 500,
                    headers: response.headers,
                    body: Buffer.concat(chunks),
                  });
                });
              });

              request.on("error", (error) => {
                reject(error);
              });

              if (serializedBody) {
                request.write(serializedBody);
              }

              request.end();
            });

            if (
              remoteResponse.status !== 404 &&
              remoteResponse.status !== 405 &&
              remoteResponse.status !== 400
            ) {
              break;
            }

            if (index === candidates.length - 1) {
              break;
            }

            console.warn("proxy: retrying with fallback", {
              previousStatus: remoteResponse.status,
              nextAttempt: index + 2,
            });
          } catch (error) {
            lastError = error;
            if (index === candidates.length - 1) {
              throw error;
            }
          }
        }

        if (!remoteResponse) {
          throw lastError || new Error("No response from remote API");
        }

        const responseHeaders: Record<string, string> = {};
        for (const [name, value] of Object.entries(remoteResponse.headers)) {
          if (typeof value === "string") {
            responseHeaders[name] = value;
          } else if (Array.isArray(value) && value.length > 0) {
            responseHeaders[name] = value.join(", ");
          }
        }

        console.info("proxy: response", {
          path: responsePath,
          targetUrl: lastTargetUrl,
          status: remoteResponse.status,
          headers: responseHeaders,
        });

        const forbiddenResponseHeaders = new Set([
          "access-control-allow-origin",
          "transfer-encoding",
          "content-length",
          "connection",
          "keep-alive",
        ]);

        res.status(remoteResponse.status);
        for (const [name, value] of Object.entries(responseHeaders)) {
          if (forbiddenResponseHeaders.has(name.toLowerCase())) continue;
          res.setHeader(name, value);
        }

        res.send(remoteResponse.body);
      } catch (err) {
        console.error("Proxy API error:", err);
        res.status(502).json({ error: "Bad gateway", details: String(err) });
      }
    });
  }
);
