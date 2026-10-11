import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetPortfolioChatStatusResponse,
  GetPortfolioGithubResponse,
  StreamPortfolioChatBody,
  SubmitPortfolioContactBody,
} from "@workspace/api-zod";
import {
  offlinePortfolioAnswer,
  portfolioContent,
  portfolioContextFor,
} from "@workspace/portfolio-content";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const githubCacheMs = 5 * 60 * 1000;
const githubProfile = portfolioContent.codingProfiles.find(
  (profile) => profile.name.toLowerCase() === "github",
);
let githubCache:
  | { expiresAt: number; repositories: ReturnType<typeof GetPortfolioGithubResponse.parse> }
  | undefined;

function safeString(value: unknown, maxLength = 120): string | undefined {
  return typeof value === "string" ? value.slice(0, maxLength) : undefined;
}

function getOpenAIApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.portfoliio;
}

function logProviderFailure(
  error: unknown,
  statusCode?: number,
  details?: { type?: unknown; code?: unknown },
) {
  const key = getOpenAIApiKey();
  const rawMessage = error instanceof Error ? error.message : String(error);
  const safeMessage = key ? rawMessage.split(key).join("[redacted]") : rawMessage;

  logger.error(
    {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: safeMessage.slice(0, 300),
      ...(statusCode === undefined ? {} : { providerStatus: statusCode }),
      ...(safeString(details?.type) ? { providerErrorType: safeString(details?.type) } : {}),
      ...(safeString(details?.code) ? { providerErrorCode: safeString(details?.code) } : {}),
    },
    "Portfolio AI provider request failed",
  );
}

function sendEvent(res: Response, data: unknown) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sendDone(res: Response) {
  res.write("data: [DONE]\n\n");
}

function startEventStream(res: Response) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
}

function aiErrorForStatus(status: number): string {
  if (status === 429) return "Rate limit reached, try again shortly";
  if (status >= 400 && status < 500) return "AI provider rejected the request";
  return "AI provider is temporarily unavailable. Please try again shortly.";
}

router.get("/portfolio/github", async (_req, res) => {
  if (githubCache && githubCache.expiresAt > Date.now()) {
    return res.json(githubCache.repositories);
  }
  if (!githubProfile?.username) {
    logger.error("Portfolio GitHub profile has no username configured");
    return res.status(502).json({ error: "GitHub profile is not configured" });
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(githubProfile.username)}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Jasmitha-Developer-Portfolio",
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      logger.error({ upstreamStatus: response.status }, "GitHub repository request failed");
      return res.status(502).json({ error: "GitHub could not be reached" });
    }

    const upstream: unknown = await response.json();
    if (!Array.isArray(upstream)) {
      logger.error("GitHub returned an unexpected repository response");
      return res.status(502).json({ error: "GitHub returned an unexpected response" });
    }

    const repositories = GetPortfolioGithubResponse.parse(
      upstream
        .filter((repo) => repo && typeof repo === "object" && !("fork" in repo && repo.fork))
        .map((repo) => {
          const item = repo as Record<string, unknown>;
          return {
            name: item.name,
            description: item.description,
            language: item.language,
            updatedAt: item.updated_at,
            htmlUrl: item.html_url,
            stars: item.stargazers_count,
          };
        })
        .slice(0, 12),
    );
    githubCache = { repositories, expiresAt: Date.now() + githubCacheMs };
    return res.json(repositories);
  } catch (error) {
    logger.error(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "GitHub repository request failed",
    );
    return res.status(502).json({ error: "GitHub could not be reached" });
  }
});

router.post("/portfolio/contact", (req, res) => {
  const parsed = SubmitPortfolioContactBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check the contact form fields." });
  }
  if (parsed.data.website) {
    return res.json({ status: "sent" });
  }
  return res.status(503).json({
    error: "Email service is not configured. Please use the direct email link.",
  });
});

router.get("/portfolio/chat/status", (_req, res) => {
  const status = GetPortfolioChatStatusResponse.parse({
    mode: getOpenAIApiKey() ? "ai" : "offline",
  });
  return res.json(status);
});

async function handleChat(req: Request, res: Response) {
  const parsed = StreamPortfolioChatBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please enter a valid message." });
  }
  const input = parsed.data;
  const apiKey = getOpenAIApiKey();

  if (!apiKey) {
    startEventStream(res);
    sendEvent(res, { delta: offlinePortfolioAnswer(input.message) });
    sendDone(res);
    return res.end();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const onClose = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on("close", onClose);

  try {
    const audienceStyle: Record<typeof input.audience, string> = {
      recruiter: "Be concise and clear for a recruiter.",
      beginner: "Use beginner-friendly explanations and define jargon.",
      developer: "Use precise technical language without overstating implementation.",
      judge: "Summarize project intent, implementation, and limits for a hackathon judge.",
    };
    const context = portfolioContextFor(input.message);
    const providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "system",
            content:
              `You are Jas AI, a friendly assistant for Jasmitha's developer portfolio. ` +
              `Answer questions about her only using the supplied portfolio context. ` +
              `Do not invent experience, project capabilities, performance results, or claims. ` +
              `If context does not support an answer, say so. ${audienceStyle[input.audience]} ` +
              `Portfolio context: ${context}`,
          },
          ...input.history,
          { role: "user", content: input.message },
        ],
      }),
      signal: controller.signal,
    });

    if (!providerResponse.ok) {
      const providerBody = (await providerResponse.json().catch(() => null)) as
        | { error?: { type?: unknown; code?: unknown } }
        | null;
      const safeDetails = providerBody?.error ?? {};
      logProviderFailure(
        new Error(`AI provider returned HTTP ${providerResponse.status}`),
        providerResponse.status,
        safeDetails,
      );
      const status = providerResponse.status === 429 ? 429 : 502;
      return res.status(status).json({ error: aiErrorForStatus(providerResponse.status) });
    }
    if (!providerResponse.body) {
      logProviderFailure(new Error("AI provider response did not include a stream"));
      return res.status(502).json({
        error: "AI provider is temporarily unavailable. Please try again shortly.",
      });
    }

    startEventStream(res);
    const reader = providerResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";
      if (done && buffer) {
        events.push(buffer);
        buffer = "";
      }

      for (const event of events) {
        const data = event
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") {
          continue;
        }
        try {
          const completion = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: unknown } }>;
          };
          const delta = completion.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) sendEvent(res, { delta });
        } catch (error) {
          logProviderFailure(error);
          sendEvent(res, { error: "AI provider is temporarily unavailable. Please try again shortly." });
          sendDone(res);
          return res.end();
        }
      }

      if (done) break;
      if (controller.signal.aborted) return;
    }

    sendDone(res);
    return res.end();
  } catch (error) {
    if (controller.signal.aborted && !res.writableEnded) {
      logProviderFailure(error);
      if (!res.headersSent) {
        return res.status(502).json({
          error: "AI provider is temporarily unavailable. Please try again shortly.",
        });
      }
      sendEvent(res, { error: "AI provider is temporarily unavailable. Please try again shortly." });
      sendDone(res);
      return res.end();
    }
    if (res.destroyed) return;
    logProviderFailure(error);
    if (!res.headersSent) {
      return res.status(502).json({
        error: "AI provider is temporarily unavailable. Please try again shortly.",
      });
    }
    sendEvent(res, { error: "AI provider is temporarily unavailable. Please try again shortly." });
    sendDone(res);
    return res.end();
  } finally {
    clearTimeout(timeout);
    res.off("close", onClose);
  }
}

router.post("/portfolio/chat", handleChat);
router.post("/chat", handleChat);

export default router;
