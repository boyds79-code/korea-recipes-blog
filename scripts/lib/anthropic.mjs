const API_URL = 'https://api.anthropic.com/v1/messages';

// TODO: 최신 모델 ID를 확인하고 필요하면 교체하세요.
// https://docs.claude.com/en/docs/about-claude/models
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Claude API를 호출해서 레시피 글 초안을 JSON으로 받아옵니다.
 */
export async function generateRecipeDraft({ dish, notes, tier, referenceStyle, apiKey, model }) {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되어 있지 않습니다. GitHub Actions Secret 또는 로컬 .env를 확인하세요.');
  }

  const systemPrompt = `You are an experienced Korean home cook who writes English-language recipe posts for readers outside Korea who want to cook real Korean food at home, often without easy access to a Korean grocery store.

Your job: write one complete, original, genuinely useful recipe post for the given dish.

Hard requirements:
- Do not just restate a generic version of the recipe found everywhere online. Add real cooking knowledge: why a step matters, what texture/color/smell to look for, common mistakes, and practical substitutions for ingredients that are hard to find outside Korea.
- Structure: a short, appetizing intro (2-4 sentences, no heading) explaining what makes this dish good and any context worth knowing, then numbered or clearly-headed step-by-step cooking instructions using H2 (##) sections, then a closing section with serving suggestions and/or substitutions.
- Do NOT repeat the ingredient list inside the body text — the ingredient list is handled separately in structured data. Just reference ingredients naturally while explaining steps.
- Length: roughly 500-900 words for the body (excluding ingredients).
- Tone: confident, warm, practical — like a home cook explaining to a friend, not a formal cookbook.
- Include one natural place partway through (between two steps, not at the very start or end) where the text says literally "<!--AD_SLOT-->" on its own line.
- Give realistic prep time, cook time, servings, and a difficulty level (easy/medium/hard) appropriate for a home cook outside Korea.
- List ingredients with real, practical measurements (cups, tbsp, grams) — a reader should be able to shop from this list directly.
- Do not fabricate specific brand names or invented nutrition/calorie numbers.

You must respond by calling the "submit_recipe" tool exactly once with the complete recipe.`;

  const tierContext =
    tier === 'chef-simple'
      ? 'This dish is inspired by simple, no-fuss recipes popular among Korean home cooks on Korean-language YouTube (e.g. quick "one-person meal" or "college student" style cooking) — it may be less well-known to foreign audiences than classic dishes, so briefly explain what it is and why it is loved in Korea before diving into the recipe.'
      : 'This is a dish that is already well-known and searched for by English-speaking readers interested in Korean food, so you can assume some baseline familiarity, but still explain any Korean-specific ingredients or techniques.';

  const userPrompt = [
    `Dish: ${dish}`,
    notes ? `Things to make sure to cover: ${notes}` : null,
    referenceStyle ? `Style/tone reference (for inspiration only — do not copy content, wording, or claim affiliation): ${referenceStyle}` : null,
    tierContext,
  ]
    .filter(Boolean)
    .join('\n\n');

  const body = {
    model: model || DEFAULT_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: 'submit_recipe',
        description: 'Submit the finished recipe post.',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'SEO-friendly recipe title, under 70 characters if possible.' },
            description: { type: 'string', description: 'Meta description, 140-160 characters, enticing and accurate.' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: '2-5 short lowercase tags, e.g. ["stew", "beginner-friendly", "pork"]',
            },
            image_query: {
              type: 'string',
              description: 'A short (2-4 word) English search phrase to find a relevant stock photo of this dish or its ingredients on a stock photo site (e.g. "kimchi stew", "korean fried chicken").',
            },
            prep_time: { type: 'string', description: 'e.g. "15 minutes"' },
            cook_time: { type: 'string', description: 'e.g. "25 minutes"' },
            servings: { type: 'string', description: 'e.g. "2-3 servings"' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
            ingredients: {
              type: 'array',
              items: { type: 'string' },
              description: 'Full ingredient list, one item per line, with realistic measurements (e.g. "2 cups sour kimchi, chopped").',
            },
            body_markdown: { type: 'string', description: 'The full recipe body in Markdown, per the system instructions (no ingredient list, no H1).' },
          },
          required: ['title', 'description', 'tags', 'image_query', 'prep_time', 'cook_time', 'servings', 'difficulty', 'ingredients', 'body_markdown'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_recipe' },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API 호출 실패 (${res.status}): ${text}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((block) => block.type === 'tool_use' && block.name === 'submit_recipe');
  if (!toolUse) {
    throw new Error('Claude 응답에서 submit_recipe tool 호출을 찾지 못했습니다. 응답: ' + JSON.stringify(data));
  }

  return toolUse.input;
}
