import { Router, type IRouter } from "express";
import { chatModel, openai } from "@codemapai/openai-server";
import {
  ExplainNodeBody,
  ExplainFlowBody,
  GetLearningPathBody,
  AskCodebaseBody,
} from "@codemapai/api-contracts";

const router: IRouter = Router();

function parseAiJson(rawText: string): Record<string, unknown> {
  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fencedJson) {
      return JSON.parse(fencedJson.trim());
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }

    throw new Error("AI response was not valid JSON.");
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function aiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status?: unknown }).status;
    const message = err instanceof Error ? err.message : "OpenRouter request failed";
    return `OpenRouter error${typeof status === "number" ? ` ${status}` : ""}: ${message}`;
  }

  return err instanceof Error ? err.message : "Failed to generate AI response";
}

async function createAiCompletion(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: chatModel,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    return response.choices[0]?.message?.content || "{}";
  } catch (err: any) {
    if (err?.status === 400 || err?.message?.includes("response_format") || err?.message?.includes("supported")) {
      const response = await openai.chat.completions.create({
        model: chatModel,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0]?.message?.content || "{}";
    }
    throw err;
  }
}

router.post("/ai/explain-node", async (req, res) => {
  const parseResult = ExplainNodeBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { nodeId, nodeName, nodePath, nodeType, repoName, repoContext, content } = parseResult.data;

  try {
    const prompt = `You are a code expert helping developers understand codebases. Analyze this code element and provide a concise, beginner-friendly explanation.

Repository: ${repoName}
${repoContext ? `Repo context: ${repoContext}` : ""}

Node: ${nodeName}
Path: ${nodePath}
Type: ${nodeType}
${content ? `\nContent preview:\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\`` : ""}

Respond in JSON with this exact structure:
{
  "what": "1-2 sentences: what this file/folder/function does",
  "why": "1-2 sentences: why it exists in the project",
  "connections": "1-2 sentences: how it connects to or depends on other parts",
  "complexity": "low" | "medium" | "high",
  "tips": ["1 key insight or tip for a developer reading this", "another tip if relevant"]
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      nodeId,
      what: typeof parsed.what === "string" ? parsed.what : "No explanation available.",
      why: typeof parsed.why === "string" ? parsed.why : "Purpose unclear from context.",
      connections: typeof parsed.connections === "string" ? parsed.connections : "Connections unknown.",
      complexity: parsed.complexity || "low",
      tips: stringArray(parsed.tips),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to explain node");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

router.post("/ai/explain-flow", async (req, res) => {
  const parseResult = ExplainFlowBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { nodeIds, nodePaths, repoName, repoContext } = parseResult.data;

  try {
    const prompt = `You are a code expert. Explain the data flow between these files/modules in the ${repoName} repository.

${repoContext ? `Repo context: ${repoContext}` : ""}

Selected nodes (in order):
${nodePaths.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Generate a step-by-step explanation of how data flows between these components. Be concise and beginner-friendly.

Respond in JSON:
{
  "summary": "1-2 sentence overview of what this flow accomplishes",
  "steps": [
    {
      "stepNumber": 1,
      "nodeId": "the node id or path",
      "nodePath": "the file path",
      "description": "what happens at this step",
      "dataIn": "what data enters this step (optional)",
      "dataOut": "what data leaves this step (optional)"
    }
  ]
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "Flow explanation generated.",
      steps: Array.isArray(parsed.steps) ? parsed.steps : nodeIds.map((id, i) => ({
        stepNumber: i + 1,
        nodeId: id,
        nodePath: nodePaths[i] || id,
        description: `Step ${i + 1}: Process in ${nodePaths[i] || id}`,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to explain flow");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

router.post("/ai/learning-path", async (req, res) => {
  const parseResult = GetLearningPathBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { repoName, rootNode, languages } = parseResult.data;

  function flattenPaths(node: { path: string; type: string; children?: typeof node[] }, paths: string[] = []): string[] {
    if (node.type === "file") paths.push(node.path);
    node.children?.forEach((c) => flattenPaths(c, paths));
    return paths;
  }

  const allPaths = flattenPaths(rootNode as Parameters<typeof flattenPaths>[0]);
  const languageList = languages?.join(", ") || "Unknown";

  try {
    const prompt = `You are a code mentor helping a developer understand the "${repoName}" codebase.

Languages used: ${languageList}

Files in this repository:
${allPaths.slice(0, 60).join("\n")}
${allPaths.length > 60 ? `... and ${allPaths.length - 60} more files` : ""}

Create a learning path: suggest the ideal order to read these files for someone new to this codebase. Focus on the most important files. Pick 5-10 key files.

Respond in JSON:
{
  "summary": "1-2 sentences about what this codebase does and the best approach to learning it",
  "estimatedTime": "e.g. '30 minutes' or '2 hours'",
  "steps": [
    {
      "order": 1,
      "nodePath": "exact file path from the list",
      "concept": "brief concept title",
      "reason": "why read this first - what you'll learn"
    }
  ]
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "Learning path generated.",
      estimatedTime: typeof parsed.estimatedTime === "string" ? parsed.estimatedTime : "30 minutes",
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to generate learning path");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

router.post("/ai/ask", async (req, res) => {
  const parseResult = AskCodebaseBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { question, repoName, repoContext } = parseResult.data;

  try {
    const prompt = `You are a code expert answering questions about the "${repoName}" codebase.

${repoContext ? `Repository structure context:\n${repoContext}` : ""}

Question: ${question}

Answer concisely and helpfully. If you can reference specific files or modules, do so.

Respond in JSON:
{
  "answer": "your clear, helpful answer",
  "referencedPaths": ["list", "of", "relevant", "file", "paths", "mentioned"],
  "referencedNodeIds": ["same paths work as ids"],
  "confidence": "high" | "medium" | "low"
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      answer: typeof parsed.answer === "string" ? parsed.answer : "Could not generate an answer.",
      referencedPaths: stringArray(parsed.referencedPaths),
      referencedNodeIds: stringArray(parsed.referencedNodeIds),
      confidence: typeof parsed.confidence === "string" ? parsed.confidence : "medium",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to answer question");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

router.post("/ai/voice/speak", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "validation_error", message: "text is required" });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "config_error", message: "ElevenLabs API key not configured" });
    return;
  }

  try {
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — clear, natural voice

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 1000),
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      req.log.error({ status: elevenRes.status, body: errText }, "ElevenLabs API error");
      res.status(502).json({ error: "tts_error", message: "ElevenLabs returned an error" });
      return;
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.set("Content-Length", String(audioBuffer.byteLength));
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    req.log.error({ err }, "Failed to generate speech via ElevenLabs");
    res.status(500).json({ error: "tts_error", message: "Failed to generate speech" });
  }
});

router.post("/ai/security-audit", async (req, res) => {
  const { code, filePath, language } = req.body || {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "validation_error", message: "code string is required" });
    return;
  }

  try {
    const prompt = `You are a Senior Security Architect and Code Auditor. Analyze the following code for security vulnerabilities, memory leaks, hardcoded secrets, unsafe queries, and performance bottlenecks.

${filePath ? `File Path: ${filePath}` : ""}
${language ? `Language: ${language}` : ""}

Code to audit:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Respond in JSON with this exact structure:
{
  "score": 85,
  "summary": "1-2 sentence overview of code security posture",
  "vulnerabilities": [
    {
      "severity": "critical",
      "type": "Vulnerability Type",
      "lineHint": "line hint",
      "issue": "description",
      "remediation": "how to fix"
    }
  ],
  "bestPractices": ["recommendation 1"]
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      score: typeof parsed.score === "number" ? parsed.score : 80,
      summary: typeof parsed.summary === "string" ? parsed.summary : "Security audit completed.",
      vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : [],
      bestPractices: stringArray(parsed.bestPractices),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to perform security audit");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

router.post("/ai/refactor", async (req, res) => {
  const { code, filePath, focus } = req.body || {};
  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "validation_error", message: "code string is required" });
    return;
  }

  try {
    const prompt = `You are an expert Software Engineer. Refactor and modernize the following code snippet. Focus on ${focus || "performance, readability, and modern best practices"}.

${filePath ? `File Path: ${filePath}` : ""}

Original Code:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

Respond in JSON:
{
  "summary": "1-2 sentence explanation of refactoring improvements",
  "refactoredCode": "complete refactored code snippet",
  "keyImprovements": ["improvement 1"]
}`;

    const rawText = await createAiCompletion(prompt);
    const parsed = parseAiJson(rawText);

    res.json({
      summary: typeof parsed.summary === "string" ? parsed.summary : "Refactoring complete.",
      refactoredCode: typeof parsed.refactoredCode === "string" ? parsed.refactoredCode : code,
      keyImprovements: stringArray(parsed.keyImprovements),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to perform code refactoring");
    res.status(502).json({ error: "ai_error", message: aiErrorMessage(err) });
  }
});

export default router;
