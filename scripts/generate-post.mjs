import fs from 'node:fs';
import path from 'node:path';
import { getNextTopic } from './lib/topic-sources.mjs';
import { generateRecipeDraft, SLUG_PLACEHOLDER } from './lib/anthropic.mjs';
import { slugify } from './lib/slugify.mjs';

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
    `heroImage: ${yamlString(`/images/blog/${slug}/finished.jpg`)}`,
    `heroImageAlt: ${yamlString(draft.finished_photo.alt)}`,
    '---',
    '',
  ].join('\n');

  // Claude가 재료 사진 자리에 써넣은 {{SLUG}} placeholder를 실제 슬러그로 치환
  let body = draft.body_markdown.replaceAll(SLUG_PLACEHOLDER, slug);
  body = body.replace('<!--AD_SLOT-->', '<!-- AD_SLOT: 광고 자동 삽입 위치 표시용, 렌더링에는 영향 없음 -->');

  const checklist = [
    '<!--',
    `📷 이 레시피에 필요한 사진 2장 (머지 전에 준비해서 넣어주세요) — public/images/blog/${slug}/ 폴더 안에 아래 파일명 그대로 넣으면 자동으로 연결됩니다.`,
    `1. finished.jpg (대표/커버 이미지) — ${draft.finished_photo.description}`,
    `2. ingredients.jpg — ${draft.ingredients_photo.description}`,
    '-->',
    '',
  ].join('\n');

  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(filePath, frontmatter + checklist + body.trim() + '\n');

  console.log(`[generate-post] 작성 완료: ${filePath}`);
  console.log(`[generate-post] 필요한 사진 2장 (public/images/blog/${slug}/ 안에 넣어주세요):`);
  console.log(`  - finished.jpg: ${draft.finished_photo.description}`);
  console.log(`  - ingredients.jpg: ${draft.ingredients_photo.description}`);

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
