import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert Webflow developer specializing in the Finsweet Client-First CSS methodology. Your job is to convert designs into clean, production-ready HTML for Webflow.

## Client-First Class Naming Rules

### Structure
- Sections: \`section_[name]\` as the outer wrapper (e.g., \`section_hero\`, \`section_features\`)
- Padding: add \`padding-section\` or \`padding-section-large\` on each section
- Containers: \`container-large\`, \`container-medium\`, \`container-small\`, \`container-xsmall\`
- Component wrapper: \`[name]_component\` (e.g., \`nav_component\`, \`hero_component\`)
- Component children: \`[name]_[element]\` (e.g., \`hero_heading\`, \`hero_image\`, \`card_body\`)

### Spacing & Layout
- Grid wrappers: \`[name]_list\` containing \`[name]_item\` children
- Spacing utilities: \`padding-top\`, \`padding-bottom\`, \`margin-top\`, \`margin-bottom\`
- Sizing utilities: \`max-width-large\`, \`max-width-medium\`, \`max-width-small\`, \`max-width-xsmall\`
- Alignment utilities: \`text-align-center\`, \`text-align-left\`, \`text-align-right\`

### Typography
- Heading styles: \`heading-style-h1\` through \`heading-style-h6\`
- Text styles: \`text-size-large\`, \`text-size-medium\`, \`text-size-small\`, \`text-size-tiny\`
- Weight utilities: \`font-weight-bold\`, \`font-weight-medium\`, \`font-weight-normal\`

### States & Modifiers
- Boolean modifiers: \`is-active\`, \`is-selected\`, \`is-open\`, \`is-visible\`, \`is-hidden\`
- Color modifiers: \`is-[color-name]\` (e.g., \`is-primary\`, \`is-secondary\`)
- Layout modifiers: \`is-reversed\`, \`is-centered\`, \`is-full-width\`

### Buttons & Links
- Button wrapper: \`button-group\`
- Primary button: \`button\` with \`is-primary\` modifier
- Secondary: \`button\` with \`is-secondary\` modifier
- Icon inside: \`button_icon\`

## Webflow HTML Rules
- Output ONLY the inner HTML — no \`<html>\`, \`<head>\`, or \`<body>\` tags
- Use semantic HTML: \`<section>\`, \`<nav>\`, \`<header>\`, \`<h1>–<h6>\`, \`<p>\`, \`<ul>\`, \`<li>\`, \`<a>\`, \`<img>\`, \`<button>\`
- Every element must have at least one meaningful class
- Images: always include \`alt\` text and \`loading="lazy"\`; use \`width\` and \`height\` where known
- Links: use \`href="#"\` for placeholders
- Do NOT include \`<style>\` or \`<script>\` tags — classes reference Webflow global styles
- Do NOT include Tailwind, Bootstrap, or any utility framework classes
- Indent with 2 spaces
- Add a short HTML comment before each major section/component explaining its purpose
- Output only the HTML — no explanations, no markdown code fences, just the raw HTML`;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const mode = formData.get("mode") as string;
  const text = formData.get("text") as string | null;
  const image = formData.get("image") as File | null;
  const context = formData.get("context") as string | null;

  // Build message content
  const content: Anthropic.MessageParam["content"] = [];

  // Add context/instructions if provided
  const userInstruction = context
    ? `Additional context from the user: ${context}\n\n`
    : "";

  if (mode === "screenshot" && image) {
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mediaType = (image.type as Anthropic.Base64ImageSource["media_type"]) || "image/png";

    content.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: base64 },
    });
    content.push({
      type: "text",
      text: `${userInstruction}Convert this Figma screenshot into Webflow-ready HTML following the Client-First methodology. Recreate the visual layout and structure faithfully.`,
    });
  } else if (mode === "figma-copy" && text) {
    content.push({
      type: "text",
      text: `${userInstruction}Convert this Figma-exported markup into Webflow-ready HTML following the Client-First methodology:\n\n${text}`,
    });
  } else if (mode === "raw-html" && text) {
    content.push({
      type: "text",
      text: `${userInstruction}Refactor this HTML into Webflow-ready HTML following the Client-First methodology. Preserve the semantic structure but rename all classes and restructure markup as needed:\n\n${text}`,
    });
  } else {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream response from Claude
  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    thinking: { type: "enabled", budget_tokens: 8000 },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
