# Finosu Voice Bot

This bot assists in collecting information about the client and the loan they would be taking. It is currently deployed on only the web.

## Live Demo

Web app:

```text
https://finosu-bot.vercel.app
```

# Architecture

Web Browser -> Next.js app deployed via Vercel -> LiveKit Room -> STT + LLM + TTS -> Next.js /api/submit-intake -> Zod basic validation -> Resend email

# TODO:

Telephony
Resend via Domain Registration
