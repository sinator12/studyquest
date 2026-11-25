import JSZip from "jszip";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { type Question } from "./quizData";
import { getAIConfig, DEFAULT_GROQ_KEY, DEFAULT_NVIDIA_KEY, type AIProviderConfig } from "./studyStore";

// Configure PDF.js worker once for reliable client-side PDF parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface DocumentExtractionResult {
  text: string;
  charCount: number;
  pageCount?: number;
  format: string;
  warning?: string;
}

export interface GenerateOptions {
  count?: number;
  subjectHint?: string;
  seed?: number;
  excludeQuestions?: string[];
  onProgress?: (stage: string) => void;
}

export interface QuestionAnalysis {
  isHelpful: boolean;
  verdict: "helpful" | "needs_clarity" | "not_helpful";
  helpfulnessScore: number;
  thinking: string;
  refinedQuestion?: string;
  suggestions?: string[];
}

export interface ExplainerResult {
  topic: string;
  summary: string;
  keyPoints: { title: string; explanation: string; analogy?: string }[];
  funFact: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  analysis?: QuestionAnalysis;
  blockedByAnalysis?: boolean;
}

const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "from", "have", "has", "had", "were", "was", "are", "been",
  "being", "which", "their", "there", "these", "those", "about", "into", "over", "after", "before",
  "during", "between", "through", "under", "above", "within", "without", "because", "while", "where",
  "when", "what", "such", "many", "most", "some", "other", "more", "than", "then", "also", "only",
  "both", "each", "every", "could", "would", "should", "might", "must", "will", "shall", "they",
  "them", "your", "ours", "yours", "very", "just", "like", "make", "made", "used", "using", "uses",
  "known", "called", "form", "forms", "part", "parts", "type", "types", "system", "process", "study",
  "notes", "chapter", "page", "slide", "document", "section", "example", "examples", "including"
]);

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractXmlNodeText(xmlString: string, tagNames: string[]): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");
    const lines: string[] = [];

    for (const tag of tagNames) {
      const nodes = Array.from(doc.getElementsByTagName(tag));
      for (const node of nodes) {
        const t = (node.textContent || "").replace(/\s+/g, " ").trim();
        if (t) lines.push(t);
      }
      if (lines.length > 0) break;
    }

    if (lines.length > 0) return lines.join("\n");
    return (doc.documentElement?.textContent || "").replace(/\s+/g, " ").trim();
  } catch {
    return xmlString.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 60);
    const pageTexts: string[] = [];

    for (let p = 1; p <= maxPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      let currentLine = "";
      const lines: string[] = [];

      for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        if (!item.str) continue;
        currentLine += item.str;
        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        } else if (!currentLine.endsWith(" ")) {
          currentLine += " ";
        }
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      const pageBlock = lines.join("\n").trim();
      if (pageBlock) {
        pageTexts.push(pageBlock);
      }
    }

    const joined = normalizeExtractedText(pageTexts.join("\n\n"));
    if (joined.length >= 20) {
      return { text: joined, pageCount: pdf.numPages };
    }
  } catch (err) {
    console.warn("PDF.js extraction warning, trying fallback stream parser:", err);
  }

  // Fallback for simple uncompressed PDF text streams
  const rawText = new TextDecoder("latin1").decode(new Uint8Array(arrayBuffer));
  const textMatches: string[] = [];
  const tjRegex = /\(([^()]{2,})\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(rawText)) !== null) {
    const cleaned = match[1].replace(/\\([()\\])/g, "$1").trim();
    if (cleaned.length > 1) textMatches.push(cleaned);
  }
  const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(rawText)) !== null) {
    const innerMatches = match[1].match(/\(([^()]+)\)/g);
    if (innerMatches) {
      textMatches.push(...innerMatches.map((im) => im.slice(1, -1).replace(/\\([()\\])/g, "$1")));
    }
  }

  return {
    text: normalizeExtractedText(textMatches.join(" ")),
    pageCount: 1
  };
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const targetFiles = Object.keys(zip.files)
    .filter(
      (name) =>
        name === "word/document.xml" ||
        /^word\/(header|footer|footnotes|endnotes)\d*\.xml$/i.test(name)
    )
    .sort((a, b) => (a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b)));

  const parts: string[] = [];
  for (const name of targetFiles) {
    const xml = await zip.files[name].async("string");
    const extracted = extractXmlNodeText(xml, ["w:p", "p"]);
    if (extracted) parts.push(extracted);
  }
  return normalizeExtractedText(parts.join("\n\n"));
}

async function extractPptxText(arrayBuffer: ArrayBuffer): Promise<{ text: string; slideCount: number }> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/i)?.[1] || "0", 10);
      const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || "0", 10);
      return na - nb;
    });

  const parts: string[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.files[slideFiles[i]].async("string");
    const slideText = extractXmlNodeText(slideXml, ["a:p", "p"]);
    const slideNum = slideFiles[i].match(/slide(\d+)/i)?.[1] || String(i + 1);

    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let notesText = "";
    if (zip.files[notesPath]) {
      const notesXml = await zip.files[notesPath].async("string");
      notesText = extractXmlNodeText(notesXml, ["a:p", "p"]);
    }

    if (slideText || notesText) {
      parts.push(`Slide ${slideNum}: ${[slideText, notesText].filter(Boolean).join("\n")}`);
    }
  }
  return { text: normalizeExtractedText(parts.join("\n\n")), slideCount: slideFiles.length };
}

async function extractXlsxText(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const sharedStrings: string[] = [];

  if (zip.files["xl/sharedStrings.xml"]) {
    const ssXml = await zip.files["xl/sharedStrings.xml"].async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(ssXml, "application/xml");
    const siNodes = Array.from(doc.getElementsByTagName("si"));
    for (const si of siNodes) {
      sharedStrings.push((si.textContent || "").replace(/\s+/g, " ").trim());
    }
  }

  const sheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort();

  const rowsText: string[] = [];
  for (const sheetName of sheetFiles) {
    const xml = await zip.files[sheetName].async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const rows = Array.from(doc.getElementsByTagName("row"));
    for (const row of rows) {
      const cells = Array.from(row.getElementsByTagName("c"));
      const vals: string[] = [];
      for (const c of cells) {
        const type = c.getAttribute("t");
        const vNode = c.getElementsByTagName("v")[0];
        const isNode = c.getElementsByTagName("is")[0];
        if (type === "s" && vNode?.textContent) {
          const idx = parseInt(vNode.textContent, 10);
          if (!Number.isNaN(idx) && sharedStrings[idx]) vals.push(sharedStrings[idx]);
        } else if (isNode?.textContent) {
          vals.push(isNode.textContent.trim());
        } else if (vNode?.textContent) {
          vals.push(vNode.textContent.trim());
        }
      }
      if (vals.length > 0) rowsText.push(vals.join(" — "));
    }
  }

  if (rowsText.length === 0 && sharedStrings.length > 0) {
    return normalizeExtractedText(sharedStrings.join("\n"));
  }
  return normalizeExtractedText(rowsText.join("\n"));
}

function extractLegacyBinaryOfficeText(bytes: Uint8Array): string {
  // Legacy .doc/.ppt/.xls files contain either UTF-16LE runs or ASCII text runs
  const noisePattern =
    /(Microsoft|Word\.Document|SummaryInformation|Root Entry|Normal\.dotm|Times New Roman|Calibri|Cambria|Arial|Helvetica|Heading \d|Default Paragraph|Table Normal|Content_Types|rels\/\.rels|bjbj)/i;

  const chunks: string[] = [];

  // 1) Try UTF-16LE scan for meaningful prose sentences
  let utf16Run = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const lo = bytes[i];
    const hi = bytes[i + 1];
    const code = lo | (hi << 8);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
      utf16Run += String.fromCharCode(code);
    } else {
      const trimmed = utf16Run.trim();
      if (trimmed.length >= 24 && /[a-z]{3,}\s+[a-z]{2,}/i.test(trimmed) && !noisePattern.test(trimmed)) {
        chunks.push(trimmed);
      }
      utf16Run = "";
    }
  }

  // 2) Fallback ASCII scan
  if (chunks.join(" ").length < 80) {
    let asciiRun = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        asciiRun += String.fromCharCode(b);
      } else {
        const trimmed = asciiRun.trim();
        if (trimmed.length >= 24 && /[a-z]{3,}\s+[a-z]{2,}/i.test(trimmed) && !noisePattern.test(trimmed)) {
          chunks.push(trimmed);
        }
        asciiRun = "";
      }
    }
  }

  const deduped = Array.from(new Set(chunks));
  return normalizeExtractedText(deduped.join("\n"));
}

/**
 * Extracts full readable text from documents (.pdf, .docx, .pptx, .xlsx, .odt, .rtf, .txt, .md, .csv, .html, etc.)
 * Returns structured metadata + warning if a file has no extractable text (e.g. scanned image).
 */
export async function extractDocumentDetails(file: File): Promise<DocumentExtractionResult> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  // 1. HTML / XML / SVG
  if (["html", "htm"].includes(extension)) {
    try {
      const raw = await file.text();
      const doc = new DOMParser().parseFromString(raw, "text/html");
      doc.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
      const text = normalizeExtractedText(doc.body?.textContent || "");
      return { text: text.slice(0, 30000), charCount: text.length, format: extension.toUpperCase() };
    } catch {
      // fall through
    }
  }

  // 2. Plain text, Markdown, CSV, JSON, Code
  if (
    ["txt", "md", "markdown", "csv", "tsv", "json", "xml", "yaml", "yml", "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "cs", "sql"].includes(
      extension
    )
  ) {
    try {
      const raw = await file.text();
      const text = normalizeExtractedText(raw);
      return {
        text: text.slice(0, 30000),
        charCount: text.length,
        format: extension.toUpperCase(),
        warning: text.length < 20 ? "This file appears empty or has very little readable text." : undefined
      };
    } catch {
      // fall through
    }
  }

  // 3. Rich Text Format (.rtf)
  if (extension === "rtf") {
    try {
      const raw = await file.text();
      const cleaned = raw
        .replace(/\\par[d]?/g, "\n")
        .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\{\\\*[^}]*\}/g, " ")
        .replace(/\\([a-zA-Z]+(-?\d+)? ?|.)/g, " ")
        .replace(/[{}]/g, " ");
      const text = normalizeExtractedText(cleaned);
      return {
        text: text.slice(0, 30000),
        charCount: text.length,
        format: "RTF",
        warning: text.length < 20 ? "Could not detect readable prose inside this RTF file." : undefined
      };
    } catch {
      // fall through
    }
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    return {
      text: "",
      charCount: 0,
      format: extension.toUpperCase() || "FILE",
      warning: `Could not read bytes from "${file.name}".`
    };
  }

  // 4. PDF (.pdf)
  if (extension === "pdf") {
    const { text, pageCount } = await extractPdfText(arrayBuffer);
    return {
      text: text.slice(0, 30000),
      charCount: text.length,
      pageCount,
      format: "PDF",
      warning:
        text.length < 20
          ? "No selectable text was found inside this PDF (it may be a scanned image). Try pasting the text or using a text-based PDF/DOCX."
          : undefined
    };
  }

  // 5. Modern Word (.docx)
  if (extension === "docx") {
    try {
      const text = await extractDocxText(arrayBuffer);
      return {
        text: text.slice(0, 30000),
        charCount: text.length,
        format: "DOCX",
        warning: text.length < 20 ? "This DOCX file appears to have no body text." : undefined
      };
    } catch (err) {
      console.warn("DOCX zip parse failed, trying legacy fallback:", err);
    }
  }

  // 6. Modern PowerPoint (.pptx)
  if (extension === "pptx") {
    try {
      const { text, slideCount } = await extractPptxText(arrayBuffer);
      return {
        text: text.slice(0, 30000),
        charCount: text.length,
        pageCount: slideCount,
        format: "PPTX",
        warning: text.length < 20 ? "No slide text was found inside this PPTX file." : undefined
      };
    } catch (err) {
      console.warn("PPTX zip parse failed:", err);
    }
  }

  // 7. Excel (.xlsx)
  if (extension === "xlsx") {
    try {
      const text = await extractXlsxText(arrayBuffer);
      return {
        text: text.slice(0, 30000),
        charCount: text.length,
        format: "XLSX",
        warning: text.length < 20 ? "No cell text was found inside this XLSX workbook." : undefined
      };
    } catch (err) {
      console.warn("XLSX zip parse failed:", err);
    }
  }

  // 8. OpenDocument (.odt, .odp, .ods)
  if (["odt", "odp", "ods"].includes(extension)) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      if (zip.files["content.xml"]) {
        const xml = await zip.files["content.xml"].async("string");
        const text = normalizeExtractedText(extractXmlNodeText(xml, ["text:p", "text:h", "p"]));
        return {
          text: text.slice(0, 30000),
          charCount: text.length,
          format: extension.toUpperCase()
        };
      }
    } catch {
      // fall through
    }
  }

  // 9. Image files warning
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(extension)) {
    return {
      text: "",
      charCount: 0,
      format: extension.toUpperCase(),
      warning: "Image files do not contain selectable text. Paste key notes from the image or upload a PDF, DOCX, PPTX, or TXT file."
    };
  }

  // 10. Legacy binary Office (.doc, .ppt, .xls) or generic ZIP/UTF-8 text
  const bytes = new Uint8Array(arrayBuffer);
  // Check if zip header (PK\x03\x04) — maybe renamed OOXML
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer);
      const xmlNames = Object.keys(zip.files).filter((n) => n.endsWith(".xml") && !n.includes("[Content_Types]"));
      const collected: string[] = [];
      for (const n of xmlNames.slice(0, 20)) {
        const rawXml = await zip.files[n].async("string");
        const parsed = extractXmlNodeText(rawXml, ["w:p", "a:p", "text:p", "p"]);
        if (parsed.length > 20) collected.push(parsed);
      }
      const joined = normalizeExtractedText(collected.join("\n"));
      if (joined.length >= 20) {
        return { text: joined.slice(0, 30000), charCount: joined.length, format: extension.toUpperCase() || "ZIP-DOC" };
      }
    } catch {
      // ignore
    }
  }

  if (["doc", "ppt", "xls"].includes(extension)) {
    const legacy = extractLegacyBinaryOfficeText(bytes);
    return {
      text: legacy.slice(0, 30000),
      charCount: legacy.length,
      format: extension.toUpperCase(),
      warning:
        legacy.length < 30
          ? `Legacy .${extension} binary could not be fully decoded. Save as .${extension}x or .pdf, or paste the notes directly.`
          : undefined
    };
  }

  const decoded = normalizeExtractedText(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
  if (decoded.length >= 30 && !decoded.includes("\ufffd\ufffd\ufffd")) {
    return { text: decoded.slice(0, 30000), charCount: decoded.length, format: extension.toUpperCase() || "TEXT" };
  }

  return {
    text: "",
    charCount: 0,
    format: extension.toUpperCase() || "FILE",
    warning: `Could not extract readable text inside "${file.name}". Try PDF, DOCX, PPTX, XLSX, TXT, or Markdown.`
  };
}

/**
 * Backwards-compatible wrapper returning the extracted text string.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const details = await extractDocumentDetails(file);
  return details.text;
}

/* ------------------------------------------------------------------ */
/*  AI PROVIDER ORCHESTRATION (NVIDIA Main -> Groq Secondary -> NLP)  */
/* ------------------------------------------------------------------ */

const NVIDIA_ENDPOINT = "/api/nvidia/chat/completions";
const NVIDIA_MODELS = [
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "mistralai/mistral-large-4-1t-a52b"
];

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"];

type ProviderStep = "nvidia" | "groq" | "gemini" | "openai" | "builtin";

function getProviderOrder(config: AIProviderConfig): ProviderStep[] {
  switch (config.provider) {
    case "builtin":
      return ["builtin"];
    case "groq":
      return ["groq", "nvidia", "builtin"];
    case "gemini":
      return ["gemini", "nvidia", "groq", "builtin"];
    case "openai":
      return ["openai", "nvidia", "groq", "builtin"];
    case "nvidia":
    default:
      return ["nvidia", "groq", "builtin"];
  }
}

function parseJsonResponse<T>(rawText: string): T {
  const trimmed = rawText.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return JSON.parse(fenced ? fenced[1] : trimmed) as T;
}

function getNvidiaExtraBody(model: string): Record<string, unknown> {
  if (model.includes("nemotron")) {
    return { chat_template_kwargs: { enable_thinking: false }, max_tokens: 2048 };
  }
  return { max_tokens: 2048 };
}

async function requestOpenAICompatibleJSON<T>(params: {
  providerName: string;
  endpoint: string;
  apiKey: string;
  models: string[];
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  extraBodyForModel?: (model: string) => Record<string, unknown>;
  validate: (parsed: unknown) => T | null;
}): Promise<T> {
  let lastError: unknown = null;

  for (const model of params.models) {
    try {
      const response = await fetch(params.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          temperature: params.temperature,
          ...(params.extraBodyForModel ? params.extraBodyForModel(model) : {}),
          messages: [
            { role: "system", content: params.systemPrompt },
            { role: "user", content: params.userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        lastError = new Error(`${params.providerName} (${model}) HTTP ${response.status}: ${errBody.slice(0, 180)}`);
        // On auth or quota/token exhaustion (401/402/429), switch providers immediately instead of retrying more models
        if (response.status === 401 || response.status === 402 || response.status === 429) {
          throw lastError;
        }
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        lastError = new Error(`${params.providerName} returned non-JSON response (${contentType || "unknown"})`);
        continue;
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) {
        lastError = new Error(`${params.providerName} (${model}) returned empty content`);
        continue;
      }

      const parsed = parseJsonResponse<unknown>(rawText);
      const validated = params.validate(parsed);
      if (validated) {
        return validated;
      }
      lastError = new Error(`${params.providerName} (${model}) returned unexpected JSON structure`);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("HTTP 401") || msg.includes("HTTP 402") || msg.includes("HTTP 429")) {
        throw err;
      }
    }
  }

  throw lastError || new Error(`${params.providerName} request failed`);
}

function validateExplainerResult(parsed: unknown): ExplainerResult | null {
  const candidate = parsed as Partial<ExplainerResult> | null;
  if (
    candidate &&
    typeof candidate.summary === "string" &&
    Array.isArray(candidate.keyPoints) &&
    candidate.keyPoints.length > 0 &&
    Array.isArray(candidate.questions)
  ) {
    return {
      topic: candidate.topic || "Study Concept",
      summary: candidate.summary,
      keyPoints: candidate.keyPoints,
      funFact: candidate.funFact || "",
      questions: candidate.questions
    };
  }
  return null;
}

function normalizeQuestionDeck(parsed: unknown, fallbackTitle: string): { title: string; questions: Question[] } | null {
  const candidate = parsed as { title?: string; questions?: Partial<Question>[] } | null;
  if (!candidate || !Array.isArray(candidate.questions) || candidate.questions.length === 0) {
    return null;
  }
  return {
    title: candidate.title || fallbackTitle,
    questions: candidate.questions.map((q, i) => ({
      id: q.id || 1000 + i,
      subject: q.subject || "general",
      question: q.question || "Study Question",
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
      explanation: q.explanation || "Review your notes for more details."
    }))
  };
}

function validateQuestionAnalysis(parsed: unknown): QuestionAnalysis | null {
  const candidate = parsed as Partial<QuestionAnalysis> | null;
  if (!candidate || typeof candidate.thinking !== "string" || !candidate.thinking.trim()) {
    return null;
  }

  const verdict: QuestionAnalysis["verdict"] =
    candidate.verdict === "helpful" || candidate.verdict === "needs_clarity" || candidate.verdict === "not_helpful"
      ? candidate.verdict
      : candidate.isHelpful === false
      ? "not_helpful"
      : "helpful";

  const rawScore = typeof candidate.helpfulnessScore === "number" ? candidate.helpfulnessScore : verdict === "helpful" ? 8 : verdict === "needs_clarity" ? 6 : 2;
  const helpfulnessScore = Math.max(1, Math.min(10, Math.round(rawScore)));
  const isHelpful = typeof candidate.isHelpful === "boolean" ? candidate.isHelpful : verdict !== "not_helpful";

  return {
    isHelpful,
    verdict,
    helpfulnessScore,
    thinking: candidate.thinking.trim(),
    refinedQuestion: typeof candidate.refinedQuestion === "string" && candidate.refinedQuestion.trim() ? candidate.refinedQuestion.trim() : undefined,
    suggestions: Array.isArray(candidate.suggestions)
      ? candidate.suggestions.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 3)
      : undefined
  };
}

function analyzeQuestionBuiltin(userQuery: string, documentText: string, fileName?: string): QuestionAnalysis {
  const q = userQuery.trim();
  const hasDoc = documentText.trim().length >= 30;
  const docTopics = hasDoc ? extractKeyVocabulary(documentText).slice(0, 3) : [];
  const lower = q.toLowerCase();

  // Check for empty/gibberish/greeting-only input when no document is attached
  const greetingOnly = /^(hi|hello|hey|yo|sup|test|testing|ok|okay|idk|nothing|help|asdf+|qwerty+|123+|!+|\?+|\.+)$/i.test(q);
  const hasRealWords = /[a-z]{2,}/i.test(q);
  const looksLikeGibberish = q.length >= 4 && !/[aeiouy]/i.test(q) && !/\s/.test(q);

  if (!hasDoc && (!q || q.length < 3 || greetingOnly || !hasRealWords || looksLikeGibberish)) {
    return {
      isHelpful: false,
      verdict: "not_helpful",
      helpfulnessScore: 2,
      thinking:
        "This input is too short or unclear to build accurate explanations and helpful quiz questions. Adding a specific concept, mechanism, or study question will produce much better learning material.",
      refinedQuestion: "Explain how cellular respiration produces ATP",
      suggestions: [
        "What is osmosis and why does it matter?",
        "Explain supply and demand with an example",
        "How do vaccines train the immune system?"
      ]
    };
  }

  if (hasDoc && (greetingOnly || looksLikeGibberish)) {
    const focus = docTopics.length > 0 ? docTopics.join(", ") : fileName || "the uploaded document";
    return {
      isHelpful: false,
      verdict: "not_helpful",
      helpfulnessScore: 3,
      thinking: `Your document is loaded, but "${q}" doesn't specify what you want to learn from it. Asking about ${focus} will produce sharper quiz questions.`,
      refinedQuestion: `Explain the key concepts of ${docTopics[0] || fileName || "this document"}`,
      suggestions: docTopics.length > 0
        ? docTopics.map((t) => `Explain ${t} from the uploaded notes`)
        : ["Summarize the main mechanisms in this document", "What are the key definitions in these notes?"]
    };
  }

  const wordCount = q.split(/\s+/).filter(Boolean).length;
  if (!hasDoc && wordCount <= 2 && !lower.includes("?")) {
    return {
      isHelpful: true,
      verdict: "needs_clarity",
      helpfulnessScore: 6,
      thinking: `"${q}" is a short topic label rather than a specific question, so I'll frame it around core definitions, mechanisms, and key takeaways to generate helpful quiz questions.`,
      refinedQuestion: `What are the core principles and real-world applications of ${q}?`,
      suggestions: [
        `How does ${q} work step by step?`,
        `What are common misconceptions about ${q}?`
      ]
    };
  }

  return {
    isHelpful: true,
    verdict: "helpful",
    helpfulnessScore: hasDoc ? 9 : 8,
    thinking: hasDoc
      ? `This question clearly focuses on ${q || fileName || "your uploaded material"} and can be grounded directly in the document to build targeted check questions.`
      : `"${q}" is a clear, focused learning question suitable for a structured breakdown and active-recall quiz questions.`
  };
}

/**
 * Thinks through and analyzes whether the user's question is clear and helpful
 * before generating an explanation and quiz questions.
 */
export async function analyzeQuestionWithAI(
  userQuery: string,
  documentText: string = "",
  fileName?: string
): Promise<QuestionAnalysis> {
  const config = getAIConfig();
  const hasDoc = documentText.trim().length >= 30;
  const trimmedQuery = userQuery.trim();

  // Fast local short-circuit for empty/obvious non-text when no document is attached
  if (!hasDoc && trimmedQuery.length < 2) {
    return analyzeQuestionBuiltin(trimmedQuery, documentText, fileName);
  }

  const docContext = hasDoc
    ? `Attached document (${fileName || "Uploaded Notes"}) excerpt:\n"""\n${documentText.slice(0, 2500)}\n"""`
    : "No document attached (topic/question-only query).";

  const systemPrompt =
    "You are a thoughtful curriculum tutor. Before generating study questions, think carefully and analyze whether the student's question is clear, meaningful, and helpful for learning. Strictly output valid JSON.";

  const userPrompt = `Analyze this student input BEFORE generating an explanation or quiz questions.

Student Input: "${trimmedQuery || "(No custom question — asked to explain attached document)"}"
${docContext}

Evaluate:
1. Is the input helpful and meaningful for generating an explanation and quiz questions?
   - Mark "not_helpful" (isHelpful: false) ONLY if the input is gibberish/random letters (e.g. "asdf"), a greeting ("hi", "hello"), completely vague/meaningless ("help", "idk", "123") without a useful document, or impossible to turn into educational questions.
   - Mark "needs_clarity" (isHelpful: true) if it's a valid topic or broad prompt (e.g. "osmosis", "WW1", or explaining an attached document) that works better when sharpened into a clear study focus.
   - Mark "helpful" (isHelpful: true) if it's a clear question or study request (or a valid document request).
2. Write 1-2 sentences in "thinking" explaining your reasoning clearly to the student.
3. Provide a "refinedQuestion" (a sharper study question) and 2-3 helpful "suggestions" when helpful or when refinement would help.

Return ONLY a valid JSON object matching this exact schema:
{
  "isHelpful": true,
  "verdict": "helpful",
  "helpfulnessScore": 9,
  "thinking": "1-2 sentences of clear reasoning evaluating if this question is helpful.",
  "refinedQuestion": "Optional sharper study question",
  "suggestions": ["Helpful follow-up question 1?", "Helpful follow-up question 2?"]
}`;

  const nvidiaKey = config.nvidiaKey || DEFAULT_NVIDIA_KEY;
  const groqKey = config.groqKey || DEFAULT_GROQ_KEY;

  for (const step of getProviderOrder(config)) {
    if (step === "nvidia" && nvidiaKey) {
      try {
        return await requestOpenAICompatibleJSON({
          providerName: "NVIDIA",
          endpoint: NVIDIA_ENDPOINT,
          apiKey: nvidiaKey,
          models: NVIDIA_MODELS,
          systemPrompt,
          userPrompt,
          temperature: 0.2,
          extraBodyForModel: (model) =>
            model.includes("nemotron")
              ? { chat_template_kwargs: { enable_thinking: false }, max_tokens: 450 }
              : { max_tokens: 450 },
          validate: validateQuestionAnalysis
        });
      } catch (err) {
        console.warn("NVIDIA question analysis fallback:", err);
      }
    }

    if (step === "groq" && groqKey) {
      try {
        return await requestOpenAICompatibleJSON({
          providerName: "Groq",
          endpoint: GROQ_ENDPOINT,
          apiKey: groqKey,
          models: GROQ_MODELS,
          systemPrompt,
          userPrompt,
          temperature: 0.2,
          validate: validateQuestionAnalysis
        });
      } catch (err) {
        console.warn("Groq question analysis fallback:", err);
      }
    }

    if (step === "gemini" && config.geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const validated = validateQuestionAnalysis(parseJsonResponse<unknown>(raw));
            if (validated) return validated;
          }
        }
      } catch (err) {
        console.warn("Gemini question analysis fallback:", err);
      }
    }

    if (step === "openai" && config.openaiKey) {
      try {
        return await requestOpenAICompatibleJSON({
          providerName: "OpenAI",
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: config.openaiKey,
          models: ["gpt-4o-mini"],
          systemPrompt,
          userPrompt,
          temperature: 0.2,
          validate: validateQuestionAnalysis
        });
      } catch (err) {
        console.warn("OpenAI question analysis fallback:", err);
      }
    }
  }

  return analyzeQuestionBuiltin(trimmedQuery, documentText, fileName);
}

export async function explainContentWithAI(
  userQuery: string,
  documentText: string = "",
  options: {
    fileName?: string;
    seed?: number;
    excludeQuestions?: string[];
    skipQuestionCheck?: boolean;
    forceExplain?: boolean;
    onProgress?: (stage: string) => void;
    onAnalysis?: (analysis: QuestionAnalysis) => void;
  } = {}
): Promise<ExplainerResult> {
  const config = getAIConfig();
  const hasDoc = documentText.trim().length >= 30;
  const trimmedQuery = userQuery.trim();
  const displayTopic =
    trimmedQuery && !/^explain the key concepts/i.test(trimmedQuery)
      ? trimmedQuery.slice(0, 80)
      : options.fileName
      ? options.fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")
      : trimmedQuery.slice(0, 80) || "Study Concept";

  // Pre-generation thinking step: analyze if the user's question is helpful before generating questions
  let analysis: QuestionAnalysis | undefined;
  if (!options.skipQuestionCheck) {
    options.onProgress?.("Thinking & analyzing if your question is helpful...");
    analysis = await analyzeQuestionWithAI(trimmedQuery, documentText, options.fileName);
    options.onAnalysis?.(analysis);

    if (!analysis.isHelpful && analysis.verdict === "not_helpful" && !options.forceExplain) {
      return {
        topic: displayTopic,
        summary: "",
        keyPoints: [],
        funFact: "",
        questions: [],
        analysis,
        blockedByAnalysis: true
      };
    }
  }

  const combinedInput = hasDoc
    ? `Document (${options.fileName || "Uploaded Notes"}):\n${documentText.slice(0, 15000)}${
        trimmedQuery ? `\n\nStudent Focus / Question: ${trimmedQuery}` : ""
      }`
    : trimmedQuery;

  const analysisGuidance = analysis
    ? `\nQuestion Analysis Insight: ${analysis.thinking}${
        analysis.refinedQuestion ? `\nTarget Study Focus: ${analysis.refinedQuestion}` : ""
      }`
    : "";

  const excludeNote =
    options.excludeQuestions && options.excludeQuestions.length > 0
      ? `\nDo NOT repeat any of these previously asked questions:\n- ${options.excludeQuestions.join("\n- ")}`
      : "";

  const prompt = `You are a clear, rigorous curriculum educator.
${
  hasDoc
    ? `Read the FULL study document contents below carefully — do NOT guess only from the filename or title. Base your summary, key points, and quiz questions directly on the concepts, facts, and mechanisms inside the document.`
    : `Explain the student's topic clearly and accurately.`
}${analysisGuidance}
${excludeNote}

${combinedInput}

Return ONLY a valid JSON object matching this exact schema:
{
  "topic": "Concise accurate title of the material or concept",
  "summary": "A 2-3 sentence crystal-clear overview grounded in the document or topic.",
  "keyPoints": [
    {
      "title": "1. Core Concept / Mechanism",
      "explanation": "Plain-English breakdown of the actual concept from the material."
    },
    {
      "title": "2. Key Details & Relationships",
      "explanation": "How the parts interact, cause/effect, or key rules from the material."
    },
    {
      "title": "3. Real-World Analogy",
      "explanation": "A concrete comparison that makes the idea stick.",
      "analogy": "One vivid analogy sentence."
    }
  ],
  "funFact": "A notable takeaway or surprising detail connected to this material.",
  "questions": [
    {
      "question": "Question 1 testing core understanding?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct."
    },
    {
      "question": "Question 2 testing practical application?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Why this answer is correct."
    },
    {
      "question": "Question 3 testing a key distinction or fact?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Why this answer is correct."
    }
  ]
}`;

  const nvidiaKey = config.nvidiaKey || DEFAULT_NVIDIA_KEY;
  const groqKey = config.groqKey || DEFAULT_GROQ_KEY;
  const systemPrompt =
    "You are an educational assistant that strictly outputs valid JSON explanations grounded in the provided document.";

  for (const step of getProviderOrder(config)) {
    if (step === "nvidia" && nvidiaKey) {
      try {
        options.onProgress?.("Analyzing document contents with NVIDIA AI...");
        const res = await requestOpenAICompatibleJSON({
          providerName: "NVIDIA",
          endpoint: NVIDIA_ENDPOINT,
          apiKey: nvidiaKey,
          models: NVIDIA_MODELS,
          systemPrompt,
          userPrompt: prompt,
          temperature: 0.35,
          extraBodyForModel: getNvidiaExtraBody,
          validate: validateExplainerResult
        });
        return { ...res, analysis };
      } catch (err) {
        console.warn("NVIDIA explainer fallback:", err);
      }
    }

    if (step === "groq" && groqKey) {
      try {
        options.onProgress?.("Analyzing document contents with Groq AI...");
        const res = await requestOpenAICompatibleJSON({
          providerName: "Groq",
          endpoint: GROQ_ENDPOINT,
          apiKey: groqKey,
          models: GROQ_MODELS,
          systemPrompt,
          userPrompt: prompt,
          temperature: 0.35,
          validate: validateExplainerResult
        });
        return { ...res, analysis };
      } catch (err) {
        console.warn("Groq explainer fallback:", err);
      }
    }

    if (step === "gemini" && config.geminiKey) {
      try {
        options.onProgress?.("Analyzing document contents with Google Gemini...");
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.35 }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const validated = validateExplainerResult(parseJsonResponse<unknown>(raw));
            if (validated) return { ...validated, analysis };
          }
        }
      } catch (err) {
        console.warn("Gemini explainer fallback:", err);
      }
    }

    if (step === "openai" && config.openaiKey) {
      try {
        options.onProgress?.("Analyzing document contents with OpenAI...");
        const res = await requestOpenAICompatibleJSON({
          providerName: "OpenAI",
          endpoint: "https://api.openai.com/v1/chat/completions",
          apiKey: config.openaiKey,
          models: ["gpt-4o-mini"],
          systemPrompt,
          userPrompt: prompt,
          temperature: 0.35,
          validate: validateExplainerResult
        });
        return { ...res, analysis };
      } catch (err) {
        console.warn("OpenAI explainer fallback:", err);
      }
    }
  }

  // Built-in Document & Concept Explainer (Reads inside the actual document!)
  options.onProgress?.("Synthesizing explanation from document contents...");
  await new Promise((r) => setTimeout(r, 320));
  const builtinRes = explainWithBuiltinAI(displayTopic, documentText, options.seed || 0, options.excludeQuestions || []);
  return { ...builtinRes, analysis };
}

function splitIntoSentences(text: string): string[] {
  const normalized = text
    .replace(/\r?\n+/g, " \n ")
    .replace(/[•▪◦●]/g, ". ")
    .replace(/\s+/g, " ");

  const rawChunks = normalized
    .split(/(?:\s*\n\s*|(?<=[.!?])\s+(?=[A-Z0-9"'(]))/)
    .map((s) => s.trim().replace(/^[-*•\d.)]+\s+/, "").trim())
    .filter((s) => s.length >= 22 && s.length <= 320);

  return Array.from(new Set(rawChunks));
}

function extractKeyVocabulary(text: string): string[] {
  const candidates = new Map<string, number>();

  // Multi-word capitalized terms or single domain words
  const multiWord = text.match(/\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b/g) || [];
  for (const m of multiWord) {
    const clean = m.trim();
    if (clean.length >= 4 && !STOPWORDS.has(clean.toLowerCase())) {
      candidates.set(clean, (candidates.get(clean) || 0) + 2);
    }
  }

  // Definition subjects
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const defM = line.match(/^([A-Za-z0-9\s-]{3,36})\s*(?::|-|–|—|means|refers to|is defined as)\s+/i);
    if (defM && defM[1]) {
      const t = defM[1].replace(/^[-*•\d.)]+\s*/, "").trim();
      if (t.length >= 3 && !STOPWORDS.has(t.toLowerCase())) {
        candidates.set(t, (candidates.get(t) || 0) + 4);
      }
    }
  }

  // Frequent meaningful words
  const words = text.match(/\b[A-Za-z][a-z]{4,18}\b/g) || [];
  for (const w of words) {
    const lw = w.toLowerCase();
    if (!STOPWORDS.has(lw)) {
      candidates.set(w, (candidates.get(w) || 0) + 1);
    }
  }

  return Array.from(candidates.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, 40);
}

function explainWithBuiltinAI(
  displayTopic: string,
  documentText: string,
  seed: number,
  excludeQuestions: string[]
): ExplainerResult {
  const source = documentText.trim();
  const hasDoc = source.length >= 40;

  if (!hasDoc) {
    const deck = synthesizeQuestionsForTopic(displayTopic, 4, 1, seed, excludeQuestions);
    return {
      topic: displayTopic,
      summary: `${displayTopic} centers on understanding how core principles interact in practice. Breaking the concept into its primary components, cause-and-effect steps, and concrete examples helps lock it into long-term memory.`,
      keyPoints: [
        {
          title: "1. Core Concept & Definition",
          explanation: `${displayTopic} describes a structured relationship or mechanism. Start by identifying the key inputs, actors, or variables involved and what changes from start to finish.`
        },
        {
          title: "2. Step-by-Step Mechanism",
          explanation: `Follow the sequence in order: first the trigger or condition occurs, then the intermediate transformation happens, and finally the measurable outcome is produced.`
        },
        {
          title: "3. Real-World Analogy",
          explanation: `Imagine a relay race where each runner cannot start until the baton is passed cleanly—every stage in ${displayTopic} depends on the stage before it.`,
          analogy: `Like a relay team passing a baton cleanly from one stage to the next.`
        }
      ],
      funFact: `Active recall—testing yourself right after reading about ${displayTopic}—can double retention compared with rereading notes alone.`,
      questions: deck.questions.slice(0, 3).map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || "Review the key principles above."
      }))
    };
  }

  // Analyze ACTUAL document contents
  const sentences = splitIntoSentences(source);
  const paragraphs = source
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length >= 40);
  const vocab = extractKeyVocabulary(source);
  const topTerms = vocab.slice(0, 6);

  // Build summary from opening sentences + core terms inside the document
  const summarySentences = sentences.slice(0, 2);
  const summary =
    summarySentences.length > 0
      ? summarySentences.join(" ")
      : source.slice(0, 320);

  // Pick distributed sections across the document (beginning, middle, later) so the whole doc is read!
  const keyPoints: { title: string; explanation: string; analogy?: string }[] = [];

  const sectionBuckets = [
    { label: "1. Opening Concepts & Definitions", slice: sentences.slice(0, Math.max(3, Math.ceil(sentences.length / 3))) },
    {
      label: "2. Core Mechanisms & Supporting Details",
      slice: sentences.slice(Math.floor(sentences.length / 3), Math.floor((sentences.length * 2) / 3))
    },
    {
      label: "3. Key Takeaways & Applications",
      slice: sentences.slice(Math.floor((sentences.length * 2) / 3))
    }
  ];

  for (const bucket of sectionBuckets) {
    const text = bucket.slice.slice(0, 3).join(" ").trim();
    if (text) {
      keyPoints.push({
        title: bucket.label,
        explanation: text
      });
    }
  }

  if (keyPoints.length === 0 && paragraphs.length > 0) {
    paragraphs.slice(0, 3).forEach((p, idx) => {
      keyPoints.push({
        title: `${idx + 1}. Document Section ${idx + 1}`,
        explanation: p.slice(0, 380)
      });
    });
  }

  if (keyPoints.length > 0 && topTerms.length > 0) {
    keyPoints[keyPoints.length - 1].analogy = `Key terms highlighted inside your document: ${topTerms.join(", ")}.`;
  }

  // Pick a distinct sentence for the Fun Fact / Key Highlight
  const factCandidate =
    sentences.find((s, idx) => idx > 1 && /\d+|percent|%|first|largest|main|important|discover|because/i.test(s)) ||
    sentences[Math.min(sentences.length - 1, 3)] ||
    summarySentences[0] ||
    source.slice(0, 180);

  const quizDeck = generateWithBuiltinAI(source, "file", 4, { seed, excludeQuestions });

  return {
    topic: displayTopic,
    summary,
    keyPoints,
    funFact: factCandidate,
    questions: quizDeck.questions.slice(0, 3).map((q) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation || "Derived directly from your uploaded document."
    }))
  };
}

/* ------------------------------------------------------------------ */
/*  NVIDIA / GROQ / GEMINI / OPENAI QUIZ GENERATORS                   */
/* ------------------------------------------------------------------ */

function buildQuizPrompt(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  excludeQuestions: string[] = []
): string {
  const avoidBlock =
    excludeQuestions.length > 0
      ? `\nAvoid repeating or paraphrasing these previously generated questions:\n- ${excludeQuestions.slice(0, 20).join("\n- ")}`
      : "";

  return `You are an expert curriculum educator creating interactive quiz questions.
Based on the following ${sourceType === "topic" ? "topic" : "study material"}, generate exactly ${count} fresh multiple choice questions with 4 distinct options each.
Ensure questions test key concepts, definitions, facts, and applications directly from the content.
Vary the correct answer positions (0, 1, 2, or 3) evenly across questions.${avoidBlock}

${sourceType === "topic" ? "Topic: " + content : "Study Material:\n" + content.slice(0, 15000)}

Return ONLY a valid JSON object matching this schema:
{
  "title": "A short engaging study deck title (e.g. 'Cell Biology & Mitosis Review')",
  "questions": [
    {
      "id": 1,
      "subject": "science",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this option is correct."
    }
  ]
}`;
}

export async function generateWithNvidia(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string,
  excludeQuestions: string[] = []
): Promise<{ title: string; questions: Question[] }> {
  return requestOpenAICompatibleJSON({
    providerName: "NVIDIA",
    endpoint: NVIDIA_ENDPOINT,
    apiKey,
    models: NVIDIA_MODELS,
    systemPrompt: "You are an educational assistant that strictly outputs valid JSON quiz decks.",
    userPrompt: buildQuizPrompt(content, sourceType, count, excludeQuestions),
    temperature: 0.45,
    extraBodyForModel: getNvidiaExtraBody,
    validate: (parsed) => normalizeQuestionDeck(parsed, "StudyQuest Deck")
  });
}

export async function generateWithGroq(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string,
  excludeQuestions: string[] = []
): Promise<{ title: string; questions: Question[] }> {
  return requestOpenAICompatibleJSON({
    providerName: "Groq",
    endpoint: GROQ_ENDPOINT,
    apiKey,
    models: GROQ_MODELS,
    systemPrompt: "You are an educational assistant that strictly outputs valid JSON quiz decks.",
    userPrompt: buildQuizPrompt(content, sourceType, count, excludeQuestions),
    temperature: 0.45,
    validate: (parsed) => normalizeQuestionDeck(parsed, "StudyQuest Deck")
  });
}

/**
 * Study Plan Generator (NVIDIA main -> Groq secondary -> Built-in fallback, using Study Café & Bingo Night)
 */
export async function generateStudyPlanWithGroq(
  examName: string,
  examDate: string,
  materialNotes: string,
  apiKey: string
): Promise<{
  sessions: {
    day: number;
    title: string;
    description: string;
    game: string;
    gameUrl: string;
    done: boolean;
  }[];
}> {
  const config = getAIConfig();
  const nvidiaKey = config.nvidiaKey || DEFAULT_NVIDIA_KEY;
  const groqKey = apiKey?.trim() || config.groqKey || DEFAULT_GROQ_KEY;

  const prompt = `You are a study schedule coach.
The student is preparing for "${examName}" on exam date "${examDate}".
Their study material and notes are:
"""
${materialNotes.slice(0, 10000)}
"""

Create a structured 3-session study plan to master this material.
Assign interactive games to each session:
- Session 1: "Study Café" (gameUrl: "/games/study-cafe") for foundational order-serving recall.
- Session 2: "Bingo Night" (gameUrl: "/games/bingo-night") for quick Line Bingo active recall.
- Session 3: "Study Café" (gameUrl: "/games/study-cafe") for final comprehensive mastery review.

Return ONLY a valid JSON object matching this schema:
{
  "sessions": [
    {
      "day": 1,
      "title": "Short session title",
      "description": "Specific focus based on student's actual notes",
      "game": "Study Café",
      "gameUrl": "/games/study-cafe",
      "done": false
    }
  ]
}`;

  const validatePlan = (parsed: unknown) => {
    const candidate = parsed as { sessions?: any[] } | null;
    if (!candidate || !Array.isArray(candidate.sessions) || candidate.sessions.length === 0) {
      return null;
    }
    return {
      sessions: candidate.sessions.map((s: any, idx: number) => ({
        day: s.day || idx + 1,
        title: s.title || `Session ${idx + 1}`,
        description: s.description || `Review ${examName}`,
        game: s.game?.toLowerCase().includes("bingo") ? "Bingo Night" : "Study Café",
        gameUrl: s.gameUrl?.includes("bingo") ? "/games/bingo-night" : "/games/study-cafe",
        done: Boolean(s.done)
      }))
    };
  };

  for (const step of getProviderOrder(config)) {
    if (step === "nvidia" && nvidiaKey) {
      try {
        return await requestOpenAICompatibleJSON({
          providerName: "NVIDIA",
          endpoint: NVIDIA_ENDPOINT,
          apiKey: nvidiaKey,
          models: NVIDIA_MODELS,
          systemPrompt: "You strictly output valid JSON study plans.",
          userPrompt: prompt,
          temperature: 0.4,
          extraBodyForModel: getNvidiaExtraBody,
          validate: validatePlan
        });
      } catch (err) {
        console.warn("NVIDIA study plan generation warning, trying fallback:", err);
      }
    }

    if (step === "groq" && groqKey) {
      try {
        return await requestOpenAICompatibleJSON({
          providerName: "Groq",
          endpoint: GROQ_ENDPOINT,
          apiKey: groqKey,
          models: GROQ_MODELS,
          systemPrompt: "You strictly output valid JSON study plans.",
          userPrompt: prompt,
          temperature: 0.4,
          validate: validatePlan
        });
      } catch (err) {
        console.warn("Groq study plan generation warning, trying fallback:", err);
      }
    }
  }

  // Material-aware built-in fallback extracting actual topics from notes
  const keyTerms = extractKeyVocabulary(materialNotes).slice(0, 6);
  const focusA = keyTerms.slice(0, 2).join(" & ") || examName;
  const focusB = keyTerms.slice(2, 4).join(" & ") || "core definitions";
  const focusC = keyTerms.slice(4, 6).join(" & ") || "full exam synthesis";

  return {
    sessions: [
      {
        day: 1,
        title: `Foundations: ${focusA}`.slice(0, 48),
        description: `Review core terms and definitions for ${examName} (${focusA}) in Study Café.`,
        game: "Study Café",
        gameUrl: "/games/study-cafe",
        done: false
      },
      {
        day: 2,
        title: `Active Recall: ${focusB}`.slice(0, 48),
        description: `Race to complete a Line Bingo round covering ${focusB} and key facts.`,
        game: "Bingo Night",
        gameUrl: "/games/bingo-night",
        done: false
      },
      {
        day: 3,
        title: `Mastery Check: ${focusC}`.slice(0, 48),
        description: `Complete a full-speed review shift on ${examName} before exam day (${examDate}).`,
        game: "Study Café",
        gameUrl: "/games/study-cafe",
        done: false
      }
    ]
  };
}

/**
 * Generates non-repeating questions using NVIDIA (main), Groq (secondary), Gemini, OpenAI, or Built-in NLP Engine
 */
export async function generateQuestionsFromContent(
  content: string,
  sourceType: "file" | "text" | "topic",
  options: GenerateOptions = {}
): Promise<{ title: string; questions: Question[] }> {
  const count = options.count || 10;
  const config = getAIConfig();
  const exclude = options.excludeQuestions || [];
  options.onProgress?.("Reading and analyzing study material...");

  const nvidiaKey = config.nvidiaKey || DEFAULT_NVIDIA_KEY;
  const groqKey = config.groqKey || DEFAULT_GROQ_KEY;

  for (const step of getProviderOrder(config)) {
    if (step === "nvidia" && nvidiaKey) {
      try {
        options.onProgress?.("NVIDIA AI: Generating fresh questions from your material...");
        const result = await generateWithNvidia(content, sourceType, count, nvidiaKey, exclude);
        if (result && result.questions.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn("NVIDIA generation failed, trying next provider:", err);
      }
    }

    if (step === "groq" && groqKey) {
      try {
        options.onProgress?.("Groq AI: Generating fresh questions from your material...");
        const result = await generateWithGroq(content, sourceType, count, groqKey, exclude);
        if (result && result.questions.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn("Groq generation failed, trying next provider:", err);
      }
    }

    if (step === "gemini" && config.geminiKey) {
      try {
        options.onProgress?.("Google Gemini: Generating questions from your material...");
        const result = await generateWithGemini(content, sourceType, count, config.geminiKey);
        if (result && result.questions.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn("Gemini generation failed, trying next provider:", err);
      }
    }

    if (step === "openai" && config.openaiKey) {
      try {
        options.onProgress?.("OpenAI: Generating questions from your material...");
        const result = await generateWithOpenAI(content, sourceType, count, config.openaiKey);
        if (result && result.questions.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn("OpenAI generation failed, trying next provider:", err);
      }
    }
  }

  options.onProgress?.("Synthesizing fresh questions from your material...");
  await new Promise((r) => setTimeout(r, 380));
  return generateWithBuiltinAI(content, sourceType, count, options);
}

async function generateWithGemini(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string
): Promise<{ title: string; questions: Question[] }> {
  const prompt = `You are a curriculum expert creating interactive study game questions.
Based on the following ${sourceType === "topic" ? "topic" : "study reviewer notes"}, generate exactly ${count} multiple choice questions with 4 distinct options each.
Ensure questions test key concepts, terms, definitions, and applications.
Vary the correct answer positions (0, 1, 2, or 3) evenly across questions.

${sourceType === "topic" ? "Topic: " + content : "Reviewer Content:\n" + content.slice(0, 15000)}

Return ONLY a valid JSON object matching this schema:
{
  "title": "A short engaging study deck title",
  "questions": [
    {
      "id": 1,
      "subject": "science",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini API");

  const parsed = JSON.parse(text);
  return {
    title: parsed.title || "AI Generated Study Deck",
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: i + 1,
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0
    }))
  };
}

async function generateWithOpenAI(
  content: string,
  sourceType: "file" | "text" | "topic",
  count: number,
  apiKey: string
): Promise<{ title: string; questions: Question[] }> {
  const prompt = `Based on the following ${sourceType === "topic" ? "topic" : "study material"}, generate ${count} multiple-choice study quiz questions.
${sourceType === "topic" ? "Topic: " + content : "Content:\n" + content.slice(0, 14000)}

Return JSON with format:
{
  "title": "Deck Title",
  "questions": [
    {
      "id": 1,
      "subject": "general",
      "question": "Question?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Explanation"
    }
  ]
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a professional educational quiz generator." },
        { role: "user", content: prompt }
      ],
      temperature: 0.45
    })
  });

  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title || "AI Generated Study Deck",
    questions: (parsed.questions || []).map((q: any, i: number) => ({
      ...q,
      id: i + 1
    }))
  };
}

/* ------------------------------------------------------------------ */
/*  BUILT-IN SENTENCE-AWARE NLP QUESTION GENERATOR (NO CYCLING!)      */
/* ------------------------------------------------------------------ */

function placeCorrectOptionRandomly(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const uniqueDistractors = Array.from(
    new Set(
      distractors
        .map((d) => d.trim())
        .filter((d) => d && d.toLowerCase() !== correct.trim().toLowerCase())
    )
  ).slice(0, 3);

  const fallbackPool = [
    "Catalyst", "Equilibrium", "Hypothesis", "Synthesis", "Gradient", "Variable",
    "Oxidation", "Threshold", "Spectrum", "Protocol", "Resonance", "Parameter"
  ];
  let fbIdx = 0;
  while (uniqueDistractors.length < 3 && fbIdx < fallbackPool.length) {
    const cand = fallbackPool[fbIdx++];
    if (cand.toLowerCase() !== correct.trim().toLowerCase() && !uniqueDistractors.includes(cand)) {
      uniqueDistractors.push(cand);
    }
  }

  const options = [correct.trim(), ...uniqueDistractors.slice(0, 3)];
  const correctIndex = Math.floor(Math.random() * 4);
  const tmp = options[0];
  options[0] = options[correctIndex];
  options[correctIndex] = tmp;
  return { options, correctIndex };
}

export function generateWithBuiltinAI(
  content: string,
  sourceType: "file" | "text" | "topic",
  requestedCount: number = 10,
  options: GenerateOptions = {}
): { title: string; questions: Question[] } {
  const clean = content.trim();
  const count = Math.max(3, Math.min(requestedCount, 25));
  const seed = options.seed ?? Date.now();
  const excludeSet = new Set((options.excludeQuestions || []).map((q) => q.trim().toLowerCase()));

  if (sourceType === "topic" || clean.length < 80) {
    const topic = clean || "General Knowledge";
    return synthesizeQuestionsForTopic(topic, count, 1, seed, options.excludeQuestions || []);
  }

  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const sentences = splitIntoSentences(clean);
  const vocab = extractKeyVocabulary(clean);

  const rawTitle = (lines[0] || vocab[0] || "Custom Study Notes")
    .replace(/[#*_\[\]]/g, "")
    .replace(/^(Notes from|Study material extracted from)\s+/i, "")
    .trim();
  const title = rawTitle.slice(0, 44) || "Study Reviewer";

  const candidateQuestions: Question[] = [];
  let currentId = 1;

  // 1) Extract explicit and inline definitions ("X: Y", "X means Y", "X is a Y", "X refers to Y")
  const defRegex =
    /^([A-Za-z0-9\s/()-]{3,42})\s*(?::|-|–|—|means|refers to|is defined as|is known as|is an?|are)\s+(.{14,220})$/i;
  const terms: { term: string; def: string }[] = [];

  for (const unit of [...lines, ...sentences]) {
    const m = unit.match(defRegex);
    if (m && m[1] && m[2]) {
      const term = m[1].replace(/^[\d.\-*•]+\s*/, "").trim();
      const def = m[2].trim();
      if (
        term.length >= 3 &&
        term.split(/\s+/).length <= 5 &&
        !STOPWORDS.has(term.toLowerCase()) &&
        def.length >= 12 &&
        !terms.some((t) => t.term.toLowerCase() === term.toLowerCase())
      ) {
        terms.push({ term, def });
      }
    }
  }

  // Rotate starting offset using seed so repeat generations explore new questions first
  const termOffset = terms.length > 0 ? seed % terms.length : 0;
  for (let idx = 0; idx < terms.length; idx++) {
    const target = terms[(idx + termOffset) % terms.length];
    const docDistractors = [
      ...terms.filter((t) => t.term !== target.term).map((t) => t.term),
      ...vocab.filter((v) => v.toLowerCase() !== target.term.toLowerCase())
    ];
    const { options: opts, correctIndex } = placeCorrectOptionRandomly(target.term, docDistractors);
    const qText =
      (idx + seed) % 2 === 0
        ? `Which concept matches this description: "${target.def.slice(0, 140)}"?`
        : `According to your notes, what is defined as "${target.def.slice(0, 130)}"?`;

    if (!excludeSet.has(qText.toLowerCase())) {
      candidateQuestions.push({
        id: currentId++,
        subject: "general",
        question: qText,
        options: opts,
        correctIndex,
        explanation: `${target.term}: ${target.def}`
      });
    }
  }

  // 2) Sentence-level Cloze & Key-Term Questions across ALL paragraphs of the document
  const sentOffset = sentences.length > 0 ? seed % sentences.length : 0;
  for (let idx = 0; idx < sentences.length; idx++) {
    const fact = sentences[(idx + sentOffset) % sentences.length];
    // Pick a high-value keyword from the document vocab or capitalized/long words in this sentence
    const wordsInFact = fact
      .split(/\s+/)
      .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w.toLowerCase()));

    if (wordsInFact.length === 0) continue;

    const vocabMatch = wordsInFact.find((w) => vocab.some((v) => v.toLowerCase() === w.toLowerCase()));
    const numericMatch = wordsInFact.find((w) => /^\d{2,4}(%|°C|°F)?$/.test(w));
    const keyWord = vocabMatch || numericMatch || wordsInFact[(idx + seed) % wordsInFact.length];

    if (!keyWord || keyWord.length < 3) continue;

    const escaped = keyWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const blanked = fact.replace(new RegExp(`\\b${escaped}\\b`, "i"), "_______");
    if (blanked === fact) continue;

    let distractors: string[];
    if (/^\d+$/.test(keyWord)) {
      const n = parseInt(keyWord, 10);
      distractors = [String(n + 2), String(Math.max(1, n - 3)), String(n * 2)];
    } else {
      distractors = vocab.filter((v) => v.toLowerCase() !== keyWord.toLowerCase());
    }

    const { options: opts, correctIndex } = placeCorrectOptionRandomly(keyWord, distractors);
    const qText = `Complete this statement from your study material: "${blanked}"`;

    if (!excludeSet.has(qText.toLowerCase())) {
      candidateQuestions.push({
        id: currentId++,
        subject: "general",
        question: qText,
        options: opts,
        correctIndex,
        explanation: `From your material: "${fact}"`
      });
    }
  }

  // 3) "Which statement is supported by your material?" questions for deeper comprehension
  for (let idx = 0; idx + 2 < sentences.length && candidateQuestions.length < count * 2; idx += 2) {
    const trueSent = sentences[(idx + sentOffset) % sentences.length];
    const distractorTerms = vocab.filter((v) => !trueSent.toLowerCase().includes(v.toLowerCase()));
    if (distractorTerms.length >= 3 && trueSent.length <= 130) {
      const trueShort = trueSent.slice(0, 110);
      const fake1 = `It is completely unrelated to ${distractorTerms[0]} and ${distractorTerms[1]}.`;
      const fake2 = `The process operates exclusively through ${distractorTerms[1]} without ${vocab[0] || "input"}.`;
      const fake3 = `It replaces all functions of ${distractorTerms[2]} in reverse order.`;
      const { options: opts, correctIndex } = placeCorrectOptionRandomly(trueShort, [fake1, fake2, fake3]);
      const qText = `Which statement accurately reflects your study material about ${vocab[idx % Math.max(1, vocab.length)] || title}?`;

      if (!excludeSet.has(qText.toLowerCase())) {
        candidateQuestions.push({
          id: currentId++,
          subject: "general",
          question: qText,
          options: opts,
          correctIndex,
          explanation: `Verified directly in your notes: "${trueSent}"`
        });
      }
    }
  }

  // Deduplicate by question text
  const deduped: Question[] = [];
  const seenPrompts = new Set<string>();
  for (const q of candidateQuestions) {
    const key = q.question.trim().toLowerCase();
    if (!seenPrompts.has(key) && !excludeSet.has(key)) {
      seenPrompts.add(key);
      deduped.push({ ...q, id: deduped.length + 1 });
    }
  }

  if (deduped.length < count) {
    const supplement = synthesizeQuestionsForTopic(
      vocab[0] || title,
      count - deduped.length,
      deduped.length + 1,
      seed + 17,
      [...(options.excludeQuestions || []), ...Array.from(seenPrompts)]
    );
    deduped.push(...supplement.questions);
  }

  return {
    title: `${title.slice(0, 38)} Deck`,
    questions: deduped.slice(0, count)
  };
}

/**
 * Rich multi-subject topic bank with rotation & exclusion so questionnaires don't loop identically
 */
function synthesizeQuestionsForTopic(
  topic: string,
  count: number,
  startId: number = 1,
  seed: number = Date.now(),
  excludeQuestions: string[] = []
): { title: string; questions: Question[] } {
  const t = topic.toLowerCase();
  const excludeSet = new Set(excludeQuestions.map((q) => q.trim().toLowerCase()));
  let baseQuestions: Question[] = [];
  let subject = "general";

  if (t.includes("bio") || t.includes("cell") || t.includes("plant") || t.includes("dna") || t.includes("photo") || t.includes("anat") || t.includes("heart")) {
    subject = "science";
    baseQuestions = [
      { id: 1, subject, question: "What is the primary function of mitochondria in eukaryotic cells?", options: ["ATP energy production", "Protein packaging", "DNA replication", "Lipid storage"], correctIndex: 0, explanation: "Mitochondria produce ATP via cellular respiration." },
      { id: 2, subject, question: "Which molecule carries genetic instructions from the nucleus to ribosomes?", options: ["mRNA", "tRNA", "rRNA", "Lipid"], correctIndex: 0, explanation: "Messenger RNA (mRNA) transcribes and delivers the genetic code." },
      { id: 3, subject, question: "Which pigment primarily absorbs light energy during photosynthesis?", options: ["Chlorophyll", "Carotenoid", "Anthocyanin", "Hemoglobin"], correctIndex: 0, explanation: "Chlorophyll absorbs red and blue light in the thylakoid membranes." },
      { id: 4, subject, question: "During which stage of mitosis do chromosomes align along the cell's equator?", options: ["Metaphase", "Prophase", "Anaphase", "Telophase"], correctIndex: 0, explanation: "Chromosomes line up on the metaphase plate during metaphase." },
      { id: 5, subject, question: "Which enzyme unzips the DNA double helix during replication?", options: ["DNA Helicase", "DNA Polymerase", "Ligase", "Amylase"], correctIndex: 0, explanation: "Helicase breaks hydrogen bonds between base pairs." },
      { id: 6, subject, question: "Which type of cellular transport requires ATP energy to move molecules against a gradient?", options: ["Active transport", "Facilitated diffusion", "Osmosis", "Simple diffusion"], correctIndex: 0, explanation: "Active transport uses energy to pump molecules from low to high concentration." },
      { id: 7, subject, question: "Which organelle digests cellular waste using hydrolytic enzymes?", options: ["Lysosome", "Ribosome", "Centrosome", "Golgi apparatus"], correctIndex: 0, explanation: "Lysosomes act as the recycling center of eukaryotic cells." },
      { id: 8, subject, question: "In human circulation, which heart chambers pump blood out to the lungs and body?", options: ["Ventricles", "Atria", "Valves", "Capillaries"], correctIndex: 0, explanation: "The right and left ventricles contract to pump blood out of the heart." },
      { id: 9, subject, question: "Where does the Calvin cycle take place inside a chloroplast?", options: ["Stroma", "Thylakoid lumen", "Cristae", "Nucleolus"], correctIndex: 0, explanation: "The Calvin cycle fixes CO₂ into sugars inside the chloroplast stroma." },
      { id: 10, subject, question: "What process produces four haploid gametes from one diploid parent cell?", options: ["Meiosis", "Mitosis", "Binary fission", "Transcription"], correctIndex: 0, explanation: "Meiosis halves the chromosome number to produce gametes." },
      { id: 11, subject, question: "What protein in red blood cells binds oxygen for transport?", options: ["Hemoglobin", "Insulin", "Keratin", "Collagen"], correctIndex: 0, explanation: "Hemoglobin contains iron heme groups that carry oxygen." },
      { id: 12, subject, question: "Osmosis specifically describes the diffusion of which substance across a membrane?", options: ["Water", "Glucose", "Sodium ions", "Amino acids"], correctIndex: 0, explanation: "Osmosis is the net movement of water across a semipermeable membrane." }
    ];
  } else if (t.includes("hist") || t.includes("war") || t.includes("rome") || t.includes("revolution") || t.includes("ancient")) {
    subject = "history";
    baseQuestions = [
      { id: 1, subject, question: "In which year did World War II conclude?", options: ["1945", "1944", "1939", "1950"], correctIndex: 0, explanation: "World War II ended in 1945." },
      { id: 2, subject, question: "Which 1215 English charter limited royal authority under the rule of law?", options: ["Magna Carta", "Bill of Rights", "Treaty of Versailles", "Edict of Nantes"], correctIndex: 0, explanation: "The Magna Carta established limits on royal power in 1215." },
      { id: 3, subject, question: "In which European region did the Renaissance first flourish?", options: ["Northern Italy", "Scandinavia", "Iberia", "Scotland"], correctIndex: 0, explanation: "Florence and northern Italian city-states sparked the Renaissance." },
      { id: 4, subject, question: "Who became the first emperor of the unified Roman Empire in 27 BCE?", options: ["Augustus", "Julius Caesar", "Nero", "Constantine"], correctIndex: 0, explanation: "Octavian took the title Augustus as Rome's first emperor." },
      { id: 5, subject, question: "Who introduced the movable-type printing press in Europe around 1440?", options: ["Johannes Gutenberg", "Galileo Galilei", "Martin Luther", "Isaac Newton"], correctIndex: 0, explanation: "Gutenberg's press transformed book production and literacy." },
      { id: 6, subject, question: "The Storming of the Bastille in July 1789 was a turning point in which event?", options: ["The French Revolution", "The Industrial Revolution", "The Thirty Years' War", "The American Revolution"], correctIndex: 0, explanation: "Parisians stormed the Bastille fortress on July 14, 1789." },
      { id: 7, subject, question: "Which ancient river valley civilization constructed the Pyramids of Giza?", options: ["Ancient Egypt", "Mesopotamia", "Indus Valley", "Shang Dynasty"], correctIndex: 0, explanation: "The Old Kingdom pharaohs built the Giza pyramids near the Nile." },
      { id: 8, subject, question: "What 1944 Allied operation opened the Western Front in Normandy?", options: ["D-Day (Operation Overlord)", "Operation Barbarossa", "Battle of Midway", "Treaty of Brest-Litovsk"], correctIndex: 0, explanation: "Allied forces landed at Normandy on June 6, 1944." },
      { id: 9, subject, question: "Which trade network connected East Asia, Central Asia, and the Mediterranean?", options: ["The Silk Road", "The Hanseatic League", "The Spice Triangle", "The Amber Canal"], correctIndex: 0, explanation: "The Silk Road carried silk, paper, spices, and ideas across Eurasia." },
      { id: 10, subject, question: "Which 1776 document announced the American colonies' separation from Britain?", options: ["Declaration of Independence", "Articles of Confederation", "Federalist Papers", "Treaty of Paris"], correctIndex: 0, explanation: "Adopted July 4, 1776, principally drafted by Thomas Jefferson." }
    ];
  } else if (t.includes("math") || t.includes("calc") || t.includes("algebra") || t.includes("geom")) {
    subject = "math";
    baseQuestions = [
      { id: 1, subject, question: "What is the derivative of f(x) = x³ with respect to x?", options: ["3x²", "x²", "3x", "x³/3"], correctIndex: 0, explanation: "By the power rule, d/dx(x^n) = n·x^(n-1), giving 3x²." },
      { id: 2, subject, question: "What is the hypotenuse of a right triangle with legs 6 and 8?", options: ["10", "12", "14", "9"], correctIndex: 0, explanation: "6² + 8² = 100, and √100 = 10." },
      { id: 3, subject, question: "What is the slope of the line y = 5x - 7?", options: ["5", "-7", "-5", "7"], correctIndex: 0, explanation: "In slope-intercept form y = mx + b, m = 5." },
      { id: 4, subject, question: "What is log₁₀(1000)?", options: ["3", "10", "100", "2"], correctIndex: 0, explanation: "10³ = 1000, so log₁₀(1000) = 3." },
      { id: 5, subject, question: "What is the sum of interior angles in any quadrilateral?", options: ["360°", "180°", "540°", "720°"], correctIndex: 0, explanation: "A four-sided polygon splits into two triangles: 2 × 180° = 360°." },
      { id: 6, subject, question: "What is the integral ∫ 2x dx?", options: ["x² + C", "2x² + C", "2 + C", "x + C"], correctIndex: 0, explanation: "The antiderivative of 2x is x² + C." },
      { id: 7, subject, question: "If 3x - 4 = 17, what is the value of x?", options: ["7", "6", "8", "5"], correctIndex: 0, explanation: "3x = 21, so x = 7." },
      { id: 8, subject, question: "What is the circumference formula for a circle of radius r?", options: ["2πr", "πr²", "πr", "4πr²"], correctIndex: 0, explanation: "Circumference equals 2πr (or πd)." },
      { id: 9, subject, question: "Which prime number lies strictly between 24 and 30?", options: ["29", "25", "27", "28"], correctIndex: 0, explanation: "29 is divisible only by 1 and itself." },
      { id: 10, subject, question: "What is 25% of 80?", options: ["20", "16", "25", "24"], correctIndex: 0, explanation: "0.25 × 80 = 20." }
    ];
  } else if (t.includes("code") || t.includes("program") || t.includes("js") || t.includes("javascript") || t.includes("python") || t.includes("web") || t.includes("react")) {
    subject = "general";
    baseQuestions = [
      { id: 1, subject, question: "In JavaScript, which keyword creates a block-scoped binding that cannot be reassigned?", options: ["const", "let", "var", "static"], correctIndex: 0, explanation: "const prevents reassignment within its block scope." },
      { id: 2, subject, question: "Which HTTP status code represents a successful request?", options: ["200 OK", "404 Not Found", "500 Internal Error", "403 Forbidden"], correctIndex: 0, explanation: "200 OK indicates standard HTTP success." },
      { id: 3, subject, question: "In React, which hook synchronizes a component with an external system or effect?", options: ["useEffect", "useState", "useMemo", "useId"], correctIndex: 0, explanation: "useEffect runs side effects after render." },
      { id: 4, subject, question: "Which data structure follows First-In, First-Out (FIFO) ordering?", options: ["Queue", "Stack", "Binary Heap", "Hash Set"], correctIndex: 0, explanation: "Queues dequeue elements in the order they arrived." },
      { id: 5, subject, question: "What is the worst-case time complexity of binary search on a sorted array?", options: ["O(log n)", "O(n)", "O(n²)", "O(1)"], correctIndex: 0, explanation: "Each comparison halves the remaining search interval." },
      { id: 6, subject, question: "Which data interchange format is native to JavaScript objects and REST APIs?", options: ["JSON", "INI", "CSV", "TOML"], correctIndex: 0, explanation: "JSON (JavaScript Object Notation) is the web's standard structured payload." },
      { id: 7, subject, question: "Which CSS layout model arranges items in two dimensions (rows and columns)?", options: ["CSS Grid", "Flexbox", "Float", "Inline-block"], correctIndex: 0, explanation: "CSS Grid handles explicit two-dimensional row/column tracks." },
      { id: 8, subject, question: "In Git, which command creates and switches to a new branch in modern CLI?", options: ["git switch -c", "git merge", "git stash", "git log"], correctIndex: 0, explanation: "git switch -c <branch> creates and checks out a new branch." }
    ];
  } else if (t.includes("chem") || t.includes("atom") || t.includes("acid")) {
    subject = "science";
    baseQuestions = [
      { id: 1, subject, question: "What subatomic particle determines an element's atomic number?", options: ["Proton", "Neutron", "Electron", "Positron"], correctIndex: 0, explanation: "Atomic number equals the number of protons in the nucleus." },
      { id: 2, subject, question: "What pH value represents a neutral aqueous solution at 25°C?", options: ["7", "0", "14", "5"], correctIndex: 0, explanation: "Pure water has a neutral pH of 7." },
      { id: 3, subject, question: "Which type of chemical bond involves sharing electron pairs between atoms?", options: ["Covalent bond", "Ionic bond", "Hydrogen bond", "Metallic lattice"], correctIndex: 0, explanation: "Covalent bonds share valence electrons." },
      { id: 4, subject, question: "What is the chemical symbol for Sodium?", options: ["Na", "So", "Sd", "K"], correctIndex: 0, explanation: "Na comes from Latin 'natrium'." },
      { id: 5, subject, question: "What gas is produced when hydrochloric acid reacts with zinc?", options: ["Hydrogen", "Oxygen", "Nitrogen", "Carbon dioxide"], correctIndex: 0, explanation: "Zn + 2HCl → ZnCl₂ + H₂(g)." },
      { id: 6, subject, question: "Which noble gas has atomic number 2?", options: ["Helium", "Neon", "Argon", "Krypton"], correctIndex: 0, explanation: "Helium (He) has 2 protons." }
    ];
  } else if (t.includes("geo") || t.includes("earth") || t.includes("ocean") || t.includes("continent")) {
    subject = "geography";
    baseQuestions = [
      { id: 1, subject, question: "Which is the largest ocean on Earth by surface area?", options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], correctIndex: 0, explanation: "The Pacific Ocean covers roughly a third of Earth's surface." },
      { id: 2, subject, question: "Which mountain range separates the Indian subcontinent from the Tibetan Plateau?", options: ["Himalayas", "Andes", "Alps", "Urals"], correctIndex: 0, explanation: "The Himalayas contain Mount Everest and K2." },
      { id: 3, subject, question: "Which line of 0° latitude divides the Northern and Southern Hemispheres?", options: ["Equator", "Prime Meridian", "Tropic of Cancer", "International Date Line"], correctIndex: 0, explanation: "The Equator sits at 0° latitude." },
      { id: 4, subject, question: "Which South American river carries the largest volume of water on Earth?", options: ["Amazon River", "Orinoco River", "Paraná River", "Nile River"], correctIndex: 0, explanation: "The Amazon has the greatest discharge of any river." },
      { id: 5, subject, question: "Which continent contains the Sahara Desert?", options: ["Africa", "Asia", "Australia", "South America"], correctIndex: 0, explanation: "The Sahara spans across North Africa." },
      { id: 6, subject, question: "What is the capital city of Japan?", options: ["Tokyo", "Osaka", "Kyoto", "Nagoya"], correctIndex: 0, explanation: "Tokyo has been Japan's capital since 1868." }
    ];
  } else {
    // Dynamic multi-angle topic questions so generic topics still feel varied and study-focused
    baseQuestions = [
      { id: 1, subject, question: `Which study strategy best reinforces core definitions in ${topic}?`, options: [`Active recall & self-testing on ${topic}`, `Passive rereading once`, `Skipping examples`, `Memorizing page numbers`], correctIndex: 0, explanation: `Testing yourself on ${topic} builds stronger retrieval pathways.` },
      { id: 2, subject, question: `When analyzing a new problem in ${topic}, what should you identify first?`, options: [`The core variables and constraints`, `Only the final answer`, `Unrelated trivia`, `Font formatting`], correctIndex: 0, explanation: `Clarifying inputs, terms, and constraints sets up accurate problem solving in ${topic}.` },
      { id: 3, subject, question: `What distinguishes a primary source from a secondary summary in ${topic}?`, options: [`Direct firsthand evidence or original data`, `A condensed textbook review`, `An opinion column`, `A glossary index`], correctIndex: 0, explanation: `Primary sources originate directly from the event, experiment, or author.` },
      { id: 4, subject, question: `How can you verify whether an explanation of ${topic} is reliable?`, options: [`Check verifiable evidence and consistent logic`, `Assume the longest claim is right`, `Rely on a single anecdote`, `Ignore counterexamples`], correctIndex: 0, explanation: `Sound claims in ${topic} align with verifiable facts and logic.` },
      { id: 5, subject, question: `Why are analogies useful when learning ${topic}?`, options: [`They connect unfamiliar mechanics to familiar patterns`, `They replace definitions completely`, `They remove the need to practice`, `They hide edge cases`], correctIndex: 0, explanation: `Analogies bridge new concepts in ${topic} with intuition you already have.` },
      { id: 6, subject, question: `What is the best way to handle a concept in ${topic} you missed on a quiz?`, options: [`Review the explanation and re-test it spaced apart`, `Skip it permanently`, `Guess faster next round`, `Avoid related questions`], correctIndex: 0, explanation: `Spaced repetition turns missed items in ${topic} into mastered knowledge.` },
      { id: 7, subject, question: `Which habit prevents confusion between similar terms in ${topic}?`, options: [`Comparing them side-by-side with examples`, `Studying only one term in isolation`, `Ignoring context clues`, `Cramming without breaks`], correctIndex: 0, explanation: `Contrastive comparison clarifies subtle boundaries between related concepts.` },
      { id: 8, subject, question: `What indicates true mastery of ${topic} before an exam?`, options: [`Explaining it clearly in your own words without notes`, `Recognizing the title on a slide`, `Highlighting every paragraph`, `Reading the table of contents`], correctIndex: 0, explanation: `Teaching or explaining ${topic} from memory proves deep comprehension.` }
    ];
  }

  const filtered = baseQuestions.filter((q) => !excludeSet.has(q.question.trim().toLowerCase()));
  const pool = filtered.length >= Math.min(count, 4) ? filtered : baseQuestions;

  // Deterministic-offset + random shuffle so consecutive generations always vary
  const rotated = [...pool.slice(seed % pool.length), ...pool.slice(0, seed % pool.length)];
  for (let i = rotated.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rotated[i], rotated[j]] = [rotated[j], rotated[i]];
  }

  const questions: Question[] = rotated.slice(0, count).map((q, idx) => {
    const correctIdx = Math.floor(Math.random() * 4);
    const opts = [...q.options];
    const correctVal = opts[q.correctIndex];
    opts.splice(q.correctIndex, 1);
    opts.splice(correctIdx, 0, correctVal);

    return {
      ...q,
      id: startId + idx,
      options: opts,
      correctIndex: correctIdx
    };
  });

  return {
    title: `${topic.slice(0, 34)} Deck`,
    questions
  };
}
