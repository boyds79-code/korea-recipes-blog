import fs from 'node:fs';
import path from 'node:path';
import { getNextTopic } from './lib/topic-sources.mjs';
import { generateRecipeDraft } from './lib/anthropic.mjs';
import { slugify } from './lib/slugify.mjs';
import { findAndSaveHeroImage } from './lib/images.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

async function main() {
  const { dish, notes, tier, referenceStyle } = await getNextTopic();
  console.log(`[generate-post] 티어: ${tier}`);
  console.log(`[generate-post] 요리: ${dish}`);

  const draft = await generateRecipeDraft({
    dish,
    notes,
    tier,
    referenceStyle,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.CLAUDE_MODEL,
  });

  const today = new Date().toISOString().slice(0, 10);
  let slug = slugify(draft.title);
  let filePath = path.join(BLOG_DIR, `${slug}.md`);

  let n = 2;
  while (fs.existsSync(filePath)) {
    filePath = path.join(BLOG_DIR, `${slug}-${n}.md`);
    n += 1;
  }
  slug = path.basename(filePath, '.md');

  const hero = await findAndSaveHeroImage({
    query: draft.image_query || dish,
    slug,
    apiKey: process.env.PEXELS_API_KEY,
  });
  if (hero) {
    console.log(`[generate-post] 대표 이미지: ${hero.heroImage} (${hero.heroImageCredit})`);
  } else {
    console.log('[generate-post] 대표 이미지 없이 진행합니다.');
  }

  const frontmatter = [
    '---',
    `title: ${yamlString(draft.title)}`,
    `description: ${yamlString(draft.description)}`,
    `pubDate: ${today}`,
    `tags: [${draft.tags.map((t) => yamlString(t)).join(', ')}]`,
    `tier: "${tier === 'popular' || tier === 'chef-simple' ? tier : 'manual'}"`,
    'draft: false',
    `prepTime: ${yamlString(draft.prep_time)}`,
    `cookTime: ${yamlString(draft.cook_time)}`,
    `servings: ${yamlString(draft.servings)}`,
    `difficulty: "${draft.difficulty}"`,
    'ingredients:',
    ...draft.ingredients.map((i) => `  - ${yamlString(i)}`),
    ...(hero
      ? [
          `heroImage: ${yamlString(hero.heroImage)}`,
          `heroImageAlt: ${yamlString(hero.heroImageAlt)}`,
          `heroImageCredit: ${yamlString(hero.heroImageCredit)}`,
          `heroImageCreditUrl: ${yamlString(hero.heroImageCreditUrl)}`,
        ]
      : []),
    '---',
    '',
  ].join('\n');

  const body = draft.body_markdown.replace('<!--AD_SLOT-->', '<!-- AD_SLOT: 광고 자동 삽입 위치 표시용, 렌더링에는 영향 없음 -->');

  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(filePath, frontmatter + body.trim() + '\n');

  console.log(`[generate-post] 작성 완료: ${filePath}`);

  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(
      process.env.GITHUB_ENV,
      `POST_TITLE=${draft.title}\nPOST_SLUG=${slug}\nTOPIC_SOURCE=${tier}\n`
    );
  }
}

function yamlString(s) {
  return JSON.stringify(String(s));
}

main().catch((err) => {
  console.error('[generate-post] 실패:', err);
  process.exit(1);
});
