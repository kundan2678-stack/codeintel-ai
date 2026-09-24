import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.code?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Code or diff is required",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are CodeIntel AI, an expert GitHub Pull Request reviewer.

Analyze this Pull Request diff.

Repository context:
${body.file || "GitHub Pull Request"}

Diff:
${body.code}

Look ONLY at changes shown in the diff.

Find real problems related to:
- bugs
- security
- performance
- maintainability
- reliability
- bad coding practices

Do not invent issues.

Return ONLY valid JSON using this exact structure:

{
  "summary": "short overall review",
  "risk": "Low | Medium | High | Critical",
  "score": 0,
  "findings": [
    {
      "category": "Security | Bug | Performance | Maintainability",
      "severity": "Low | Medium | High | Critical",
      "title": "short title",
      "file": "filename",
      "line": 0,
      "explanation": "why this is a problem",
      "recommendation": "how to fix it",
      "suggestedFix": "example improved code or approach"
    }
  ]
}

Rules:
- score must be between 0 and 100.
- line should refer to the changed line when possible.
- If no real issues exist, return an empty findings array.
- Do not include markdown outside the JSON.
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const text = response.output_text.trim();

    let review;

    try {
      review = JSON.parse(text);
    } catch {
      return NextResponse.json({
        success: true,
        review: {
          summary: text,
          risk: "Medium",
          score: 0,
          findings: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("AI PR Review Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI review",
      },
      { status: 500 }
    );
  }
}