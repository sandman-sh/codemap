import { Router, type IRouter } from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import path from "path";
import { FetchRepoBody } from "@codemapai/api-contracts";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

interface CodeNode {
  id: string;
  name: string;
  type: "root" | "folder" | "file" | "function" | "class" | "export";
  path: string;
  children?: CodeNode[];
  language?: string;
  size?: number;
  complexity?: "low" | "medium" | "high";
  isEntryPoint?: boolean;
}

function getLanguage(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const langMap: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
    ".py": "Python", ".java": "Java", ".go": "Go", ".rs": "Rust", ".cpp": "C++",
    ".c": "C", ".cs": "C#", ".rb": "Ruby", ".php": "PHP", ".swift": "Swift",
    ".kt": "Kotlin", ".md": "Markdown", ".json": "JSON", ".yaml": "YAML",
    ".yml": "YAML", ".css": "CSS", ".scss": "SCSS", ".html": "HTML", ".sh": "Shell",
  };
  return langMap[ext] || "Text";
}

function getComplexity(size: number): "low" | "medium" | "high" {
  if (size < 5000) return "low";
  if (size < 20000) return "medium";
  return "high";
}

function isEntryFile(name: string): boolean {
  const entries = ["index.ts", "index.tsx", "index.js", "main.ts", "main.tsx", "main.js",
    "app.ts", "app.tsx", "app.js", "server.ts", "server.js", "index.py", "main.py"];
  return entries.includes(name.toLowerCase());
}

function buildTreeFromPaths(
  repoName: string,
  files: Array<{ path: string; size: number }>
): CodeNode {
  const root: CodeNode = {
    id: "root",
    name: repoName,
    type: "root",
    path: "/",
    children: [],
  };

  const nodeMap = new Map<string, CodeNode>();
  nodeMap.set("/", root);

  const IGNORE_DIRS = new Set(["node_modules", ".git", "__pycache__", ".venv", "dist", "build", ".next"]);

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    if (parts.some((p) => IGNORE_DIRS.has(p))) continue;
    if (parts.length === 0) continue;

    let currentPath = "/";
    let parentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const newPath = currentPath === "/" ? `/${part}` : `${currentPath}/${part}`;

      if (!nodeMap.has(newPath)) {
        const node: CodeNode = {
          id: newPath,
          name: part,
          type: isLast ? "file" : "folder",
          path: newPath,
          children: isLast ? undefined : [],
          language: isLast ? getLanguage(part) : undefined,
          size: isLast ? file.size : undefined,
          complexity: isLast ? getComplexity(file.size) : undefined,
          isEntryPoint: isLast ? isEntryFile(part) : undefined,
        };
        nodeMap.set(newPath, node);
        if (!parentNode.children) parentNode.children = [];
        parentNode.children.push(node);
      }

      parentNode = nodeMap.get(newPath)!;
      currentPath = newPath;
    }
  }

  return root;
}

function getLanguages(root: CodeNode): string[] {
  const langs = new Set<string>();
  function traverse(node: CodeNode) {
    if (node.language) langs.add(node.language);
    node.children?.forEach(traverse);
  }
  traverse(root);
  return Array.from(langs);
}

function countFiles(root: CodeNode): number {
  let count = 0;
  function traverse(node: CodeNode) {
    if (node.type === "file") count++;
    node.children?.forEach(traverse);
  }
  traverse(root);
  return count;
}

function getEntryPoints(root: CodeNode): string[] {
  const entries: string[] = [];
  function traverse(node: CodeNode) {
    if (node.isEntryPoint) entries.push(node.path);
    node.children?.forEach(traverse);
  }
  traverse(root);
  return entries;
}

async function fetchGitHubRepo(url: string, branch?: string): Promise<CodeNode> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  const ref = branch || "HEAD";

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const response = await fetch(apiUrl, {
    headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "CodeMapAI" },
  });

  if (!response.ok) {
    const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    const fallbackResponse = await fetch(fallbackUrl, {
      headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "CodeMapAI" },
    });
    if (!fallbackResponse.ok) {
      const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
      const masterResponse = await fetch(masterUrl, {
        headers: { "Accept": "application/vnd.github.v3+json", "User-Agent": "CodeMapAI" },
      });
      if (!masterResponse.ok) throw new Error(`GitHub API error: ${response.status}`);
      const data = await masterResponse.json() as { tree: Array<{ path: string; type: string; size?: number }> };
      const files = data.tree.filter((f) => f.type === "blob").map((f) => ({ path: f.path, size: f.size || 0 }));
      return buildTreeFromPaths(repo, files);
    }
    const data = await fallbackResponse.json() as { tree: Array<{ path: string; type: string; size?: number }> };
    const files = data.tree.filter((f) => f.type === "blob").map((f) => ({ path: f.path, size: f.size || 0 }));
    return buildTreeFromPaths(repo, files);
  }

  const data = await response.json() as { tree: Array<{ path: string; type: string; size?: number }> };
  const files = data.tree.filter((f) => f.type === "blob").map((f) => ({ path: f.path, size: f.size || 0 }));
  return buildTreeFromPaths(repo, files);
}

router.post("/repo/fetch", async (req, res) => {
  const parseResult = FetchRepoBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { url, branch } = parseResult.data;

  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      res.status(400).json({ error: "invalid_url", message: "Please provide a valid GitHub repository URL" });
      return;
    }

    const repoName = match[2].replace(/\.git$/, "");
    const rootNode = await fetchGitHubRepo(url, branch);
    const languages = getLanguages(rootNode);
    const fileCount = countFiles(rootNode);
    const entryPoints = getEntryPoints(rootNode);

    res.json({
      repoName,
      rootNode,
      fileCount,
      languages,
      entryPoints,
      totalSize: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch repo");
    res.status(422).json({
      error: "fetch_error",
      message: err instanceof Error ? err.message : "Failed to fetch repository",
    });
  }
});

router.post("/repo/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file uploaded" });
    return;
  }

  try {
    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    const files = entries
      .filter((e) => !e.isDirectory)
      .map((e) => ({ path: e.entryName, size: e.header.size || 0 }));

    if (files.length === 0) {
      res.status(400).json({ error: "empty_zip", message: "ZIP file appears to be empty" });
      return;
    }

    const repoName = req.file.originalname.replace(/\.zip$/i, "");
    const rootNode = buildTreeFromPaths(repoName, files);
    const languages = getLanguages(rootNode);
    const fileCount = countFiles(rootNode);
    const entryPoints = getEntryPoints(rootNode);

    res.json({ repoName, rootNode, fileCount, languages, entryPoints, totalSize: req.file.size });
  } catch (err) {
    req.log.error({ err }, "Failed to process ZIP");
    res.status(400).json({
      error: "zip_error",
      message: "Failed to process ZIP file. Please ensure it is a valid ZIP archive.",
    });
  }
});

export default router;
