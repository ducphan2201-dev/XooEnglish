## Language
Always reply in Vietnamese.
Keep code, file names, commands, and error messages in their original language when needed.
Read SESSION.md before work.
Use repo files, not chat history, as the source of truth.
After each meaningful change, update SESSION.md.
Prefer minimal diffs and targeted validation.
## Language
Always respond in Vietnamese.
## Vietnamese text safety
- Never modify existing Vietnamese text in code, templates, JSON, translations, SQL, comments, or string literals unless the user explicitly asks.
- Preserve all Vietnamese characters, accents, punctuation, and line breaks exactly.
- Do not rewrite, normalize, translate, or re-encode Vietnamese text.
- If a change is required near Vietnamese text, change only the surrounding logic and keep the Vietnamese text untouched.
- When editing files that contain Vietnamese content, be extra careful to avoid encoding or escaping issues.
- Treat existing Vietnamese text as immutable content.
- If unsure, leave Vietnamese text unchanged.
## Context usage
- NEVER scan the entire repository.
- ONLY read files directly related to the current task.
- Prefer minimal file reading.
## Execution flow
- When the next step is clear, safe, and directly connected to the current task, continue implementing without waiting for another user submit.
- Only pause when blocked by missing requirements, risky destructive actions, or explicit user stop/redirection.
