# Korean Recipes, Explained — 자동 초안 + 사람 검수 레시피 블로그

`korea-blog`(문화/여행 블로그)와 같은 구조를 쓰는 **별도의 레시피 전용 블로그**입니다.
매일 GitHub Actions가 Claude API로 레시피 초안을 자동 생성해 Pull Request를 올리고,
**사람이 검토하고 머지해야만** 실제로 사이트에 발행됩니다.

## 이 블로그만의 특징

- **주제 큐가 2단계로 설계되어 있습니다** (`topics/queue.yaml`). 위쪽은 외국인들이 실제로
  가장 많이 찾고 좋아하는 한식(치킨, 비빔밥, 떡볶이, 불고기, 잡채 등 — TasteAtlas·Chef's
  Pencil 순위와 Maangchi/Seonkyoung Longest/Beyond Kimchee 등 외국인 대상 채널·블로그를
  참고해 정리), 아래쪽은 외국인 검색량은 적지만 한국 자취요리 유튜버(승우아빠 스타일 등)들이
  올리는 초간단 레시피입니다. 큐는 항상 위에서부터 순서대로 소비되므로, 자동으로 "인기
  레시피 먼저 → 이후 간단 레시피"의 흐름을 따라갑니다.
- **트렌드 자동 탐색 모드가 없습니다** (의도적). `korea-blog`와 달리 레시피는 뉴스처럼
  매일 바뀌는 소재가 아니라서, 큐가 다 소진되면 자동화가 조용히 이상한 걸 만들어내는 대신
  **명확한 에러로 실패**하고 알려줍니다. 그 시점에 `topics/queue.yaml`에 레시피를 더
  추가해주시면 됩니다.
- **Recipe 구조화 데이터(JSON-LD)** 를 자동으로 넣습니다. 조리시간·인분·재료 목록이
  구글 검색에 "레시피 리치 결과"로 노출될 가능성을 높여줍니다 (`src/layouts/RecipePost.astro`).

나머지 구조(사람 검수 후 발행, 애드센스 슬롯, About/Contact/Privacy 페이지 등)는 `korea-blog`와
동일합니다.

## 시작하기

`korea-blog`를 설정했던 것과 완전히 동일한 절차입니다 — 이 프로젝트는 **완전히 별도의
GitHub 저장소, 별도의 Vercel 프로젝트**로 만드는 걸 전제로 합니다 (같은 저장소에 합치지
않았습니다. 도메인도, 애드센스 사이트 등록도 따로 하게 됩니다).

1. `npm install && npm run build`로 로컬에서 먼저 확인
2. 새 GitHub 저장소 생성 (예: `korea-recipes-blog`) → 이 프로젝트 전체 push
3. 저장소 Settings → Actions → General → Workflow permissions에서 PR 생성 권한 켜기
4. Anthropic API 키를 `ANTHROPIC_API_KEY`로 Secret 등록 (기존 블로그와 같은 키를 재사용해도
   되고, 사용량을 나눠 보고 싶으면 새로 발급받아도 됩니다)
5. Vercel에서 이 저장소를 새 프로젝트로 Import → Deploy
6. Actions 탭에서 "Daily recipe draft" 워크플로우를 수동 실행해서 PR이 잘 열리는지 테스트

각 단계의 자세한 화면 조작법은 `korea-blog` 프로젝트를 설정할 때 받으신 가이드를 그대로
따라 하시면 됩니다 — 저장소 이름과 사이트 이름만 다를 뿐 절차는 동일합니다.

### 3-1. (추천) Gemini API 키로 이미지까지 완전 자동화

`GEMINI_API_KEY`를 Secret으로 등록해두면, 매번 필요한 완성/재료 사진 2장을 Gemini가 자동으로
생성해서 PR에 이미 채워 넣습니다 — 사람이 할 일은 PR을 열어서 확인하고 머지만 누르면 됩니다.

1. https://aistudio.google.com/apikey 에서 무료로 키 발급
2. 저장소 Settings → Secrets and variables → Actions → New repository secret →
   이름 `GEMINI_API_KEY`, 값에 발급받은 키 붙여넣기
3. (선택) 모델을 바꾸고 싶으면 Variables 탭에 `GEMINI_MODEL` 추가 — 비워두면 기본값 사용

등록하지 않아도 됩니다 — 없으면 예전처럼 AI 이미지 생성 프롬프트만 만들어지고,
`npm run photos`로 직접 채워 넣으면 됩니다. 아래 "이미지는 AI로 생성합니다" 절 참고.

## 주제 큐 다루기

- 순서를 바꾸고 싶으면 `topics/queue.yaml`에서 항목 위치를 옮기면 됩니다 (파일 맨 위 =
  다음에 발행될 레시피).
- `tier` 값(`popular` / `chef-simple`)은 자동화 로직에 영향을 주지 않고, 글 프론트매터에
  기록되어 나중에 "이 글이 어느 전략으로 나온 글인지" 추적하는 용도입니다.
- `referenceStyle`은 Claude에게 "이런 톤으로 써줘"라고 참고시키는 용도일 뿐, 실제 그
  채널·블로그의 문장을 베끼거나 인용하지 않습니다 — 시스템 프롬프트에 명시해뒀습니다.
- 큐가 비면 Actions 실행이 실패하며 이유를 로그에 남깁니다. 그때 새 레시피를 추가해주세요.

## 이미지는 AI로 생성합니다 (재료 사진 + 완성 사진, 2장 고정)

이 프로젝트는 사진을 자동으로 검색/다운로드하지 않고, 실제 촬영 사진 대신 **AI로 생성한
이미지**를 씁니다. Claude가 레시피를 쓰면서 정확히 2장의 이미지 계획을 세웁니다 —
**완성된 요리 이미지**(대표/커버 이미지)와 **재료 이미지**입니다.

### GEMINI_API_KEY를 등록한 경우 (완전 자동)

`npm run generate`(=매일 자동 실행되는 워크플로우) 단계에서 두 이미지를 Gemini가 바로
생성해서 `public/images/blog/<slug>/finished.jpg`, `ingredients.jpg`로 저장하고, PR에
이미 커밋되어 올라옵니다. PR의 "Files changed" 탭에서 이미지를 확인하고, 마음에 안 들면
같은 파일명으로 직접 다시 만들어서 덮어쓴 뒤 커밋하면 됩니다.

간혹 한 장이 실패할 수 있습니다(네트워크 오류, 안전 필터 차단 등) — 그 경우 해당 이미지만
아래 "직접 채워야 할 때" 방식의 체크리스트로 남고, 나머지 한 장은 그대로 자동 반영됩니다.

### 직접 채워야 할 때 (GEMINI_API_KEY 없음, 또는 일부 자동 생성 실패)

1. 생성된 `.md` 파일 맨 위, frontmatter 바로 아래에 이런 체크리스트가 HTML 주석으로 남습니다.
   ```
   <!--
   🎨 이 레시피에 필요한 AI 생성 이미지 2장 (머지 전에 준비해서 넣어주세요) — 아래 프롬프트로 AI가 생성한 이미지를 씁니다.
   무료 생성 도구: https://www.bing.com/images/create (Microsoft 계정만 있으면 무료) — 아래 프롬프트를 그대로 복사해서 붙여넣으세요.
   생성한 이미지는 public/images/blog/<slug>/ 폴더 안에 아래 파일명 그대로 저장하면 자동으로 연결됩니다.
   1. finished.jpg (대표/커버 이미지) — A close-up of the finished kimchi jjigae in a stone pot, garnished with green onion
   2. ingredients.jpg — Raw sliced pork belly, chopped kimchi, tofu, and garlic laid out on a cutting board
   -->
   ```
2. `npm run photos`를 실행하면 해당 PR 브랜치로 자동 전환되고, 이미지 폴더가 Finder로
   열립니다 (이미 자동 생성되어 들어가 있는 이미지가 있다면 확인만 하면 됩니다). 프롬프트를
   복사해서 https://www.bing.com/images/create 에 붙여넣어 이미지를 만든 뒤, 정확히 그
   파일명으로 폴더에 넣고 Enter를 누르면 자동으로 커밋·push됩니다.
3. 재료 이미지(`ingredients.jpg`)는 본문에도 이미 마크다운 이미지 태그로 들어가 있어서, 파일만
   그 경로에 넣으면 자동으로 연결됩니다. 완성 이미지(`finished.jpg`)는 대표 이미지로 쓰입니다.

이미지를 넣기 전 PR 미리보기에는 깨진 이미지 아이콘이 보이는데, "아직 안 채웠다"는 정상적인
신호입니다.

`scripts/backfill-hero-image.mjs`(Pexels 자동 검색)는 여전히 남아있어서 급할 때 대표 이미지
한 장을 실제 사진으로 빠르게 채우고 싶을 때 쓸 수 있지만, 기본 파이프라인에서는 더 이상
자동 호출되지 않습니다.

## 참고한 리서치 출처

- [The 10 Most Loved Korean Dishes In The World Chosen By Foreigners – Koreaboo](https://www.koreaboo.com/lists/ten-loved-korean-dishes-foreigners-tasteatlas/)
- [Top 25 Korean Foods – Chef's Pencil](https://www.chefspencil.com/top-25-korean-foods/)
- [30 Korean Food YouTubers You Must Follow – Feedspot](https://videos.feedspot.com/korean_food_youtube_channels/)
- [15 Best Korean Food Blogs and Websites – Feedspot](https://bloggers.feedspot.com/korean_food_blogs/)

## 법적 안내

`src/pages/privacy.astro`는 애드센스 심사에 필요한 최소한의 템플릿이며 법률 자문이 아닙니다.
