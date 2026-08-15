import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(), // meta description (SEO)
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // 이 레시피가 "외국인 인기 요리" 큐에서 왔는지, "한국 셰프 심플 레시피" 큐에서 왔는지 기록
    tier: z.enum(['popular', 'chef-simple', 'manual']).default('manual'),
    draft: z.boolean().default(false),

    // 레시피 전용 필드 (Recipe 구조화 데이터 + 화면 표시에 사용)
    prepTime: z.string().optional(), // 예: "15 minutes"
    cookTime: z.string().optional(), // 예: "20 minutes"
    servings: z.string().optional(), // 예: "2-3 servings"
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    ingredients: z.array(z.string()).default([]), // 계량 포함된 재료 목록 한 줄씩

    // 대표 이미지
    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroImageCredit: z.string().optional(),
    heroImageCreditUrl: z.string().optional(),
  }),
});

export const collections = { blog };
