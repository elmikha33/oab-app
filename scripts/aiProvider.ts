import Groq from "groq-sdk";
import OpenAI from "openai";

export type AiProviderMode = "auto" | "groq" | "openai";
export type AiProviderName = "Groq" | "OpenAI";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AiCandidate = {
  provider: AiProviderName;
  model: string;
  apiKey?: string;
  fallback: boolean;
};

type AiAttempt = {
  provider: AiProviderName;
  model: string;
  motivo: string;
  retryAfterMs?: number;
};

export type AiJsonResult = {
  json: Record<string, unknown>;
  provider: AiProviderName;
  model: string;
  motivo: string;
  fallbackUsado: boolean;
  attempts: AiAttempt[];
};

export class AiProviderPausedError extends Error {
  attempts: AiAttempt[];
  retryAfterMs?: number;

  constructor(message: string, attempts: AiAttempt[]) {
    super(message);
    this.name = "AiProviderPausedError";
    this.attempts = attempts;
    this.retryAfterMs = attempts.find((attempt) => attempt.retryAfterMs)?.retryAfterMs;
  }
}

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_RETRY_AFTER_MAX_MS = 15000;

export function parseAiProviderMode(raw: unknown): AiProviderMode {
  const value = String(raw || "auto").trim().toLowerCase();
  if (value === "auto" || value === "groq" || value === "openai") return value;
  throw new Error(`Provider IA invalido: ${value}. Use --provider=auto, --provider=groq ou --provider=openai.`);
}

export function getPrimaryModelLabel() {
  return process.env.GROQ_MODEL_PRIMARY || DEFAULT_GROQ_MODEL;
}

export function getStrongModelLabel() {
  return process.env.OPENAI_MODEL_STRONG || "";
}

export function strongModelConfigured() {
  return Boolean(process.env.OPENAI_API_KEY && getStrongModelLabel());
}

export async function gerarJsonComFallback(params: {
  messages: AiMessage[];
  providerMode: AiProviderMode;
  responseLabel: string;
}): Promise<AiJsonResult> {
  const candidates = listarCandidatos(params.providerMode);
  const attempts: AiAttempt[] = [];
  const providersBloqueadosPorLimite = new Set<AiProviderName>();

  if (candidates.length === 0) {
    registrarPausa("nenhum provedor IA configurado para o modo selecionado");
    throw new AiProviderPausedError(
      "Nenhum provedor IA configurado. A questao ficara pendente para a proxima execucao.",
      attempts
    );
  }

  for (const candidate of candidates) {
    if (providersBloqueadosPorLimite.has(candidate.provider)) continue;

    try {
      const texto =
        candidate.provider === "Groq"
          ? await chamarGroq(candidate, params.messages)
          : await chamarOpenAI(candidate, params.messages);
      const json = JSON.parse(limparJson(texto)) as Record<string, unknown>;
      const motivo = candidate.fallback ? "fallback usado" : "provedor primario usado";

      registrarProvider(candidate.provider, candidate.model, motivo);

      return {
        json,
        provider: candidate.provider,
        model: candidate.model,
        motivo,
        fallbackUsado: candidate.fallback,
        attempts,
      };
    } catch (err) {
      const motivo = classificarErroIa(err);
      const retryAfterMs = obterRetryAfterMs(err);
      attempts.push({
        provider: candidate.provider,
        model: candidate.model,
        motivo,
        retryAfterMs,
      });
      const retryInfo = retryAfterMs
        ? `; retry_after=${Math.round(retryAfterMs / 1000)}s`
        : "";

      registrarProvider(
        candidate.provider,
        candidate.model,
        `${motivo}${retryInfo}; tentando proximo provedor disponivel`
      );

      if (retryAfterMs) {
        await esperarRetryAfterSeguro(retryAfterMs);
      }

      if (erroEhLimiteOuQuota(motivo)) {
        providersBloqueadosPorLimite.add(candidate.provider);
      }
    }
  }

  const motivoFinal = montarMotivoPausa(attempts, params.responseLabel);
  registrarPausa(motivoFinal);
  throw new AiProviderPausedError(motivoFinal, attempts);
}

export async function gerarJsonComModeloForte(params: {
  messages: AiMessage[];
  responseLabel: string;
}): Promise<AiJsonResult> {
  const model = getStrongModelLabel();
  const apiKey = process.env.OPENAI_API_KEY;
  const attempts: AiAttempt[] = [];

  if (!model || !apiKey) {
    const motivo = "modelo forte OpenAI nao configurado";
    registrarPausa(motivo);
    throw new AiProviderPausedError(motivo, attempts);
  }

  const candidate: AiCandidate = {
    provider: "OpenAI",
    model,
    apiKey,
    fallback: true,
  };

  try {
    const texto = await chamarOpenAI(candidate, params.messages);
    const json = JSON.parse(limparJson(texto)) as Record<string, unknown>;
    const motivo = "fallback forte usado";
    registrarProvider(candidate.provider, candidate.model, motivo);

    return {
      json,
      provider: candidate.provider,
      model: candidate.model,
      motivo,
      fallbackUsado: true,
      attempts,
    };
  } catch (err) {
    const motivo = classificarErroIa(err);
    const retryAfterMs = obterRetryAfterMs(err);
    attempts.push({
      provider: candidate.provider,
      model: candidate.model,
      motivo,
      retryAfterMs,
    });
    const motivoFinal = montarMotivoPausa(attempts, params.responseLabel);
    registrarPausa(motivoFinal);
    throw new AiProviderPausedError(motivoFinal, attempts);
  }
}

function listarCandidatos(providerMode: AiProviderMode) {
  const candidates: AiCandidate[] = [];
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqPrimary = process.env.GROQ_MODEL_PRIMARY || DEFAULT_GROQ_MODEL;
  const groqFallback = process.env.GROQ_MODEL_FALLBACK;
  const openaiFallback = process.env.OPENAI_MODEL_FALLBACK || DEFAULT_OPENAI_MODEL;

  if ((providerMode === "auto" || providerMode === "groq") && groqKey) {
    candidates.push({
      provider: "Groq",
      model: groqPrimary,
      apiKey: groqKey,
      fallback: false,
    });

    if (groqFallback && groqFallback !== groqPrimary) {
      candidates.push({
        provider: "Groq",
        model: groqFallback,
        apiKey: groqKey,
        fallback: true,
      });
    }
  }

  if ((providerMode === "auto" || providerMode === "openai") && openaiKey) {
    candidates.push({
      provider: "OpenAI",
      model: openaiFallback,
      apiKey: openaiKey,
      fallback: providerMode === "auto",
    });
  }

  return candidates;
}

async function chamarGroq(candidate: AiCandidate, messages: AiMessage[]) {
  if (!candidate.apiKey) throw new Error("GROQ_API_KEY nao configurada.");
  const groq = new Groq({ apiKey: candidate.apiKey });
  type GroqCreateParams = Parameters<typeof groq.chat.completions.create>[0];
  const resposta = await groq.chat.completions.create({
    model: candidate.model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: messages as GroqCreateParams["messages"],
  });

  return resposta.choices[0]?.message?.content || "{}";
}

async function chamarOpenAI(candidate: AiCandidate, messages: AiMessage[]) {
  if (!candidate.apiKey) throw new Error("OPENAI_API_KEY nao configurada.");
  const openai = new OpenAI({ apiKey: candidate.apiKey });
  const resposta = await openai.chat.completions.create({
    model: candidate.model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages,
  });

  return resposta.choices[0]?.message?.content || "{}";
}

function limparJson(texto: string) {
  const trimmed = texto.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const semFence = fenced ? fenced[1].trim() : trimmed;
  const primeiro = semFence.indexOf("{");
  const ultimo = semFence.lastIndexOf("}");

  if (primeiro >= 0 && ultimo > primeiro) {
    return semFence.slice(primeiro, ultimo + 1);
  }

  return semFence;
}

function classificarErroIa(err: unknown) {
  const texto = extrairTextoErro(err);
  const status = extrairStatusErro(err);

  if (status === 429 || /429|rate[_\s-]?limit|tokens per (day|minute)|tpm|tpd/i.test(texto)) {
    return /quota|insufficient_quota|exceeded/i.test(texto) ? "quota/rate limit" : "rate limit";
  }

  if (/quota|insufficient_quota/i.test(texto)) return "quota";
  if (status === 401 || status === 403 || /invalid api key|unauthorized|forbidden/i.test(texto)) {
    return "credencial recusada";
  }

  return texto ? `erro do provedor: ${texto.slice(0, 180)}` : "erro do provedor";
}

function erroEhLimiteOuQuota(motivo: string) {
  return /rate limit|quota/i.test(motivo);
}

function extrairStatusErro(err: unknown) {
  const record = err as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    response?: { status?: unknown; statusCode?: unknown };
  };
  const raw = record?.status ?? record?.statusCode ?? record?.response?.status ?? record?.response?.statusCode;
  const status = Number(raw);
  return Number.isFinite(status) ? status : null;
}

function extrairTextoErro(err: unknown) {
  const record = err as {
    code?: unknown;
    type?: unknown;
    status?: unknown;
    statusCode?: unknown;
    error?: unknown;
  };
  const partes = [
    err instanceof Error ? err.message : "",
    record?.code,
    record?.type,
    record?.status,
    record?.statusCode,
  ].filter(Boolean);

  if (record?.error) {
    try {
      partes.push(JSON.stringify(record.error));
    } catch {
      partes.push(String(record.error));
    }
  }

  if (partes.length > 0) return partes.join(" ");

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function obterRetryAfterMs(err: unknown) {
  const record = err as {
    retry_after?: unknown;
    retry_after_ms?: unknown;
    retryAfter?: unknown;
    retryAfterMs?: unknown;
    headers?: unknown;
    response?: { headers?: unknown };
    error?: { retry_after?: unknown; retry_after_ms?: unknown; retryAfter?: unknown; retryAfterMs?: unknown };
  };

  const diretoMs =
    parseMsDireto(record?.retry_after_ms) ||
    parseMsDireto(record?.retryAfterMs) ||
    parseMsDireto(record?.error?.retry_after_ms) ||
    parseMsDireto(record?.error?.retryAfterMs) ||
    parseRetryAfter(record?.retry_after) ||
    parseRetryAfter(record?.retryAfter) ||
    parseRetryAfter(record?.error?.retry_after) ||
    parseRetryAfter(record?.error?.retryAfter);
  if (diretoMs) return diretoMs;

  const headerMs =
    parseRetryAfter(obterHeader(record?.headers, "retry-after")) ||
    parseRetryAfter(obterHeader(record?.response?.headers, "retry-after"));
  if (headerMs) return headerMs;

  return parseRetryAfter(extrairTextoErro(err));
}

function parseMsDireto(valor: unknown) {
  const ms = Number(valor);
  return Number.isFinite(ms) && ms > 0 ? Math.round(ms) : undefined;
}

function obterHeader(headers: unknown, name: string) {
  if (!headers) return undefined;
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (headers as { get: (key: string) => unknown }).get(name);
  }

  const record = headers as Record<string, unknown>;
  return record[name] ?? record[name.toLowerCase()] ?? record[name.toUpperCase()];
}

function parseRetryAfter(valor: unknown) {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === "number" && Number.isFinite(valor) && valor > 0) {
    return Math.round(valor * 1000);
  }

  const texto = String(valor).trim();
  if (!texto) return undefined;

  const segundos = Number(texto);
  if (Number.isFinite(segundos) && segundos > 0) return Math.round(segundos * 1000);

  const data = Date.parse(texto);
  if (Number.isFinite(data) && data > Date.now()) return data - Date.now();

  const duracao = parseDuracao(texto);
  return duracao > 0 ? duracao : undefined;
}

function parseDuracao(texto: string) {
  const lower = texto.toLowerCase();
  let total = 0;
  const horas = lower.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutos = lower.match(/(\d+(?:\.\d+)?)\s*m(?!s)/);
  const segundos = lower.match(/(\d+(?:\.\d+)?)\s*s/);
  const retry = lower.match(/retry(?:_|-| )?after[^\d]*(\d+(?:\.\d+)?)/);

  if (horas) total += Number(horas[1]) * 60 * 60 * 1000;
  if (minutos) total += Number(minutos[1]) * 60 * 1000;
  if (segundos) total += Number(segundos[1]) * 1000;
  if (!total && retry) total += Number(retry[1]) * 1000;

  return Number.isFinite(total) ? total : 0;
}

async function esperarRetryAfterSeguro(retryAfterMs: number) {
  const limite = Number(process.env.AI_RETRY_AFTER_MAX_MS || DEFAULT_RETRY_AFTER_MAX_MS);
  const espera = Math.min(retryAfterMs, Number.isFinite(limite) && limite > 0 ? limite : DEFAULT_RETRY_AFTER_MAX_MS);
  if (espera > 0) await new Promise((resolve) => setTimeout(resolve, espera));
}

function montarMotivoPausa(attempts: AiAttempt[], responseLabel: string) {
  if (attempts.length === 0) return `pausa inteligente em ${responseLabel}: sem provedor configurado`;
  const resumo = attempts
    .map((attempt) => `${attempt.provider}/${attempt.model}: ${attempt.motivo}`)
    .join(" | ");
  return `pausa inteligente em ${responseLabel}: todos os provedores falharam. ${resumo}`;
}

function registrarProvider(provider: AiProviderName, model: string, motivo: string) {
  console.log("");
  console.log("PROVEDOR IA:");
  console.log(`${provider} (${model})`);
  console.log("MOTIVO:");
  console.log(motivo);
}

function registrarPausa(motivo: string) {
  console.log("");
  console.log("PROVEDOR IA:");
  console.log("Pausado");
  console.log("MOTIVO:");
  console.log(motivo);
}
