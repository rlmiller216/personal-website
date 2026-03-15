---
name: protect-env
enabled: true
event: bash
pattern: git\s+add.*\.env(?!\.)
---

⚠️ **You're about to stage a .env file!**

This file contains API keys and secrets (Notion API key, etc.) that must **never** be committed to git.

**What to do instead:**
- Use `.env.example` for the template (no real values)
- The `.gitignore` already excludes `.env` files
- If you need to update the template, edit `.env.example`

**Safe command:** `git add .env.example`
