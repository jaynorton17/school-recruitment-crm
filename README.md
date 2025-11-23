<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13w84GHVN55hy7DTr0Mo23-nf011O2OfC

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Verify your Gemini API key
- Locally: run `npm run check:gemini` with `VITE_GEMINI_API_KEY` exported in your shell (or loaded from `.env.local`). The script makes a tiny test call and prints a success message when the key is valid.
- In GitHub Actions: add a workflow step that runs `npm run check:gemini` with the `VITE_GEMINI_API_KEY` secret to confirm the secret is wired correctly before deploying.
