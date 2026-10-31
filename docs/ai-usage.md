# AI Usage — LUMI CASA EmDash

Tài liệu này mô tả minh bạch cách AI được sử dụng trong project, những phần ứng viên tự thiết kế và cách các đề xuất của AI được review trước khi đưa vào source.

## 1. Công cụ AI đã sử dụng

- **Công cụ:** OpenAI Codex.
- **Vai trò:** hỗ trợ phân tích requirement, thảo luận kỹ thuật, đề xuất giao diện, sinh/refactor code và viết tài liệu.
- **Cách sử dụng:** AI làm việc trên source hiện tại; ứng viên đọc, học lại data flow, kiểm tra giao diện và chỉ commit sau khi hiểu thay đổi.

Không đưa credential, API token, encryption key hoặc dữ liệu bí mật cho AI hay vào tài liệu/repository.

## 2. Quy trình làm việc với AI

Project được thực hiện theo thứ tự:

1. Đọc và phân tích requirement của bài test.
2. Ứng viên thiết kế content model và cấu trúc project.
3. Hoàn thiện `seed/seed.json` và kiểm tra generated types.
4. AI hỗ trợ thiết kế giao diện và triển khai các file Astro dựa trên schema đã chốt.
5. Ứng viên học lại từng phần, kiểm tra source, thử trên EmDash Admin và commit theo từng feature.

Cách làm này hạn chế việc sinh giao diện trước khi hiểu dữ liệu hoặc sửa schema liên tục sau khi đã viết component.

## 3. Năm việc quan trọng đã nhờ AI hỗ trợ

### 3.1. Đọc và cùng suy luận requirement

Codex hỗ trợ tách yêu cầu bài test thành các nhóm có thể kiểm chứng: content model, public site Astro, EmDash Admin, Cloudflare D1/R2, SEO, security, tài liệu và production checklist. Requirement được đối chiếu với source/config hiện tại thay vì chỉ chuyển thành danh sách lý thuyết.

### 3.2. Rà soát và tối ưu content model ban đầu

Sau khi ứng viên thiết kế content model, Codex hỗ trợ rà soát `seed/seed.json`:

- Phân biệt Site Settings, Menu và collection nội dung.
- Kiểm tra field type, required/optional và repeater.
- Dùng taxonomy `product_category` cho Product.
- Dùng image object của EmDash thay vì URL string.
- Kiểm tra dữ liệu mẫu, alt text và quan hệ với `emdash-env.d.ts`.

Quyết định cuối cùng về collection, field và phạm vi schema thuộc về ứng viên.

### 3.3. Hỗ trợ thiết kế toàn bộ giao diện

Codex hỗ trợ đề xuất và triển khai visual design cho Base layout, Header, Footer, Hero, CTA, Product/Service card, Contact form, feedback modal, page động, 404, responsive CSS và empty state. Ứng viên review bố cục, màu sắc, khoảng cách và yêu cầu tinh chỉnh các vị trí chưa phù hợp.

### 3.4. Triển khai Astro sau khi hoàn thành seed

Sau khi schema và seed đã rõ, Codex hỗ trợ trải code sang các file `.astro`:

- Query bằng `getEmDashEntry()` và `getEmDashCollection()`.
- Truyền typed props từ page → layout → component.
- Dùng `ContentEntry<T>` và generated collection types.
- Render media bằng `Image` từ `emdash/ui`.
- Thêm visual-editing attributes qua `entry.edit`.
- Đăng ký cache hint và xử lý empty/optional data.

Codex cũng giải thích `Props`, generic type, `entry.data`, `entry.edit`, collection array và data flow bằng chính code của project.

### 3.5. Viết và chuẩn hóa tài liệu

Codex hỗ trợ chuẩn hóa `README.md`, ghi workflow Cloudflare Dashboard, viết `docs/ai-usage.md` và rà soát để tài liệu không chứa credential thật.

## 4. Các gợi ý/code của AI đã được sửa, bỏ hoặc kiểm chứng

| Nội dung do AI hỗ trợ | Ứng viên đã làm gì | Kết quả |
| --- | --- | --- |
| Xử lý Contact form thiên về frontend | Yêu cầu chuyển đọc và validate form sang Astro backend route; dùng POST/Redirect/GET | `contact.astro` xử lý POST, redirect `303` và modal render sau redirect |
| Footer ban đầu là nội dung tĩnh | Yêu cầu thêm menu `footer` để quản lý từ EmDash Admin | `Base.astro` query footer menu và truyền items vào `Footer.astro` |
| Giao diện do AI triển khai | Review từng page và yêu cầu chỉnh spacing, card, CTA, modal và responsive | UI được tinh chỉnh theo thiết kế LUMI CASA thay vì giữ nguyên output ban đầu |
| README ban đầu mô tả deploy bằng Wrangler CLI thủ công | Bỏ workflow CLI và thay bằng Cloudflare Dashboard + Git integration | README hiện mô tả Dashboard, bindings và Variables and Secrets |
| Query và typed props do AI viết | Học lại `ContentEntry<T>`, `Props`, `entry.data`, `entry.edit`; kiểm tra import/typecheck | Code chỉ được giữ lại sau khi ứng viên hiểu và xác nhận data flow |

Output của AI không được chấp nhận nguyên trạng: có phần được sửa, có assumption bị bỏ và có phần chỉ được giữ sau khi kiểm chứng.

## 5. Một lỗi/assumption của AI

Không có lỗi nghiêm trọng làm hỏng dữ liệu hoặc production. Tuy nhiên, Codex từng **assume quy trình deploy dùng Wrangler CLI thủ công** và viết các bước `wrangler login`, `wrangler secret put` và `npm run deploy` vào README.

Assumption này không đúng workflow thực tế vì ứng viên dùng **Cloudflare Dashboard kết nối Git repository**. Ứng viên phát hiện và yêu cầu sửa thành:

- Kết nối repository trong `Workers & Pages → Settings → Builds`.
- Cấu hình D1/R2 trong Bindings.
- Cấu hình `EMDASH_ENCRYPTION_KEY` trong Variables and Secrets.
- Push branch `main` để Cloudflare tự build/deploy.

Đây là ví dụ cho thấy tài liệu do AI sinh vẫn phải đối chiếu với workflow thực tế.

## 6. Phần ứng viên tự thiết kế

### 6.1. Content model

Ứng viên tự phân tích domain Smart Home và quyết định:

- Các collection `hero_ctas`, `products`, `services`, `pages`, `contact_info`.
- Field cần thiết cho từng collection.
- Taxonomy `product_category`.
- Phần nào dùng Site Settings, Menu hoặc collection riêng.
- Dữ liệu mẫu và phạm vi nội dung Admin được quản lý.

Codex chỉ hỗ trợ review và đề xuất tối ưu; ứng viên chốt schema cuối cùng.

### 6.2. Cấu trúc project

Ứng viên tự lựa chọn:

- `src/pages/` phụ trách route và query.
- `src/layouts/Base.astro` phụ trách layout chung và EmDash wiring.
- `src/components/` chia theo `common`, `home`, `layout`, `contact`, `services`.
- CSS chia thành global, layout, page-specific và scoped component styles.
- Utility riêng cho format, template token và site identity.
- Commit theo từng feature sau khi đã học và kiểm tra.

### 6.3. Quyết định cuối cùng

Ứng viên chịu trách nhiệm review/chấp nhận code AI, thao tác EmDash Admin, quyết định commit, quản lý Cloudflare Dashboard và secret, kiểm thử UI và đánh giá production readiness.

## 7. Phạm vi AI không thay thế

- AI không thay thế việc hiểu code trước khi commit.
- AI không tự quyết định content model hoặc kiến trúc cuối cùng.
- AI không được cung cấp credential production.
- AI không tự deploy hoặc thay đổi production state trong workflow chính.
- AI không thay thế browser testing, security review và nghiệm thu cuối cùng.

## 8. Kết luận

Codex được sử dụng như pair programmer và trợ giảng để tăng tốc phân tích requirement, review schema, triển khai giao diện Astro và viết tài liệu. Content model, cấu trúc project, workflow Cloudflare và quyết định cuối cùng đối với source vẫn do ứng viên thiết kế, kiểm tra và chịu trách nhiệm.
