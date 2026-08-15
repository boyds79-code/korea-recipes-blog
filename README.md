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

나머지 구조(사람 검수 후 발행, 대표 이미지 자동 삽입, 애드센스 슬롯, About/Contact/Privacy
페이지 등)는 `korea-blog`와 동일합니다.

## 시작하기

`korea-blog`를 설정했던 것과 완전히 동일한 절차입니다 — 이 프로젝트는 **완전히 별도의
GitHub 저장소, 별도의 Vercel 프로젝트**로 만드는 걸 전제로 합니다 (같은 저장소에 합치지
않았습니다. 도메인도, 애드센스 사이트 등록도 따로 하게 됩니다).

1. `npm install && npm run build`로 로컬에서 먼저 확인
2. 새 GitHub 저장소 생성 (예: `korea-recipes-blog`) → 이 프로젝트 전체 push
3. 저장소 Settings → Actions → General → Workflow permissions에서 PR 생성 권한 켜기
4. Anthropic API 키를 `ANTHROPIC_API_KEY`로 Secret 등록 (기존 블로그와 같은 키를 재사용해도
   되고, 사용량을 나눠 보고 싶으면 새로 발급받아도 됩니다)
5. (선택) Pexels API 키를 `PEXELS_API_KEY`로 Secret 등록
6. Vercel에서 이 저장소를 새 프로젝트로 Import → Deploy
7. Actions 탭에서 "Daily recipe draft" 워크플로우를 수동 실행해서 PR이 잘 열리는지 테스트

각 단계의 자세한 화면 조작법은 `korea-blog` 프로젝트를 설정할 때 받으신 가이드를 그대로
따라 하시면 됩니다 — 저장소 이름과 사이트 이름만 다를 뿐 절차는 동일합니다.

## 주제 큐 다루기

- 순서를 바꾸고 싶으면 `topics/queue.yaml`에서 항목 위치를 옮기면 됩니다 (파일 맨 위 =
  다음에 발행될 레시피).
- `tier` 값(`popular` / `chef-simple`)은 자동화 로직에 영향을 주지 않고, 글 프론트매터에
  기록되어 나중에 "이 글이 어느 전략으로 나온 글인지" 추적하는 용도입니다.
- `referenceStyle`은 Claude에게 "이런 톤으로 써줘"라고 참고시키는 용도일 뿐, 실제 그
  채널·블로그의 문장을 베끼거나 인용하지 않습니다 — 시스템 프롬프트에 명시해뒀습니다.
- 큐가 비면 Actions 실행이 실패하며 이유를 로그에 남깁니다. 그때 새 레시피를 추가해주세요.

## 참고한 리서치 출처

- [The 10 Most Loved Korean Dishes In The World Chosen By Foreigners – Koreaboo](https://www.koreaboo.com/lists/ten-loved-korean-dishes-foreigners-tasteatlas/)
- [Top 25 Korean Foods – Chef's Pencil](https://www.chefspencil.com/top-25-korean-foods/)
- [30 Korean Food YouTubers You Must Follow – Feedspot](https://videos.feedspot.com/korean_food_youtube_channels/)
- [15 Best Korean Food Blogs and Websites – Feedspot](https://bloggers.feedspot.com/korean_food_blogs/)

## 법적 안내

`src/pages/privacy.astro`는 애드센스 심사에 필요한 최소한의 템플릿이며 법률 자문이 아닙니다.
