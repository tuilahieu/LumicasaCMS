# LUMI CASA — EmDash Smart Home

Website giới thiệu giải pháp Smart Home được xây dựng bằng Astro và EmDash CMS. Public site được server-rendered trên Cloudflare Workers; structured content lưu trong Cloudflare D1 và media lưu trong Cloudflare R2.

## Tổng quan

Các route chính:

| Route | Nội dung |
| --- | --- |
| `/` | Hero, sản phẩm nổi bật và CTA |
| `/products` | Danh sách sản phẩm đã publish |
| `/services` | Danh sách dịch vụ đã publish |
| `/contact` | Thông tin liên hệ và form tư vấn |
| `/{slug}` | Page động từ collection `pages` |
| `/_emdash/admin` | EmDash Admin |

Project dùng `output: "server"`; content CMS không dùng `getStaticPaths()`.

## Prerequisites

- Node.js `>= 22.23.4`.
- npm `>= 9.6.5`.
- Git.
- Trình duyệt hỗ trợ passkey/WebAuthn để đăng nhập EmDash Admin.
- Để deploy: tài khoản Cloudflare có Workers, D1 và R2; repository GitHub được kết nối với Worker qua Cloudflare Dashboard.

Không đưa API token, encryption key, OAuth credential, account ID hoặc credential thật vào README, screenshot hay repository.

## Local setup

### 1. Cài dependencies

```bash
npm install
```

### 2. Tạo encryption key cho local

Nếu clone mới và chưa có `.env`, chạy:

```bash
npx emdash secrets generate --write .env
```

Lệnh tạo biến `EMDASH_ENCRYPTION_KEY` đúng định dạng. `.env` và `.dev.vars` đã được Git ignore; không commit hoặc chụp màn hình giá trị của key.

### 3. Chạy development server

```bash
npm run dev
```

- Website: `http://localhost:4321`
- Admin: `http://localhost:4321/_emdash/admin`

Development dùng D1/R2 giả lập trong `.wrangler/state/`, tách biệt với dữ liệu production. Ở database mới, request đầu tiên chạy migration và có thể áp dụng `seed/seed.json` nếu setup chưa hoàn tất.

### 4. Kiểm tra type và build

```bash
npm run typecheck
npm run build
```

Khi schema trong Admin thay đổi, để dev server đang chạy rồi cập nhật type:

```bash
npx emdash types
```

File `emdash-env.d.ts` là type được sinh từ schema EmDash; không chỉnh interface collection bằng tay.

## EmDash Admin

Admin nằm tại `/_emdash/admin`. Lần setup đầu tiên tạo tài khoản Admin và passkey. Passkey là cơ chế xác thực mặc định của EmDash trong project này; Cloudflare Access hiện chưa được cấu hình.

Admin có thể:

- Tạo, sửa, publish/unpublish và xóa Product hoặc Service.
- Quản lý Hero/CTA, page intro và thông tin liên hệ.
- Upload media và cập nhật alt text.
- Quản lý menu `primary`; layout cũng đọc menu `footer` nếu menu này tồn tại.
- Sửa SEO panel cho content thuộc collection `pages`.

Public site chỉ query entry có trạng thái `published` đối với danh sách Product và Service. Thay đổi trong Admin được lưu vào database, không sửa source Astro.

## Content Model

Schema và dữ liệu mẫu nằm tại `seed/seed.json`. Seed được đăng ký qua `package.json#emdash.seed`.

### Site Settings

| Setting | Mục đích |
| --- | --- |
| `title` | Tên website |
| `tagline` | Tagline và metadata fallback |
| `timezone` | Múi giờ của CMS |
| `dateFormat` | Định dạng ngày |
| `logo`, `favicon` | Có thể cấu hình bổ sung trong Admin |

### Collections

| Collection | Entry chính | Fields |
| --- | --- | --- |
| `hero_ctas` | `homepage` | `title`, `badge`, `description`, `cta_buttons`, `image`, `stats` |
| `products` | Nhiều entry | `title`, `description`, `price`, `image`, `sort_order` |
| `services` | Nhiều entry | `title`, `description`, `image`, `features`, `sort_order` |
| `pages` | `home`, `products`, `services`, `contact` | `title`, `badge_template`, `description` |
| `contact_info` | `main` | `title`, `badge`, `description`, `address`, `hotline`, `email`, `working_hours` |

`pages` hỗ trợ drafts, revisions, preview và SEO. Các collection còn lại hỗ trợ drafts và revisions.

### Taxonomy và menu

- Taxonomy `product_category` gắn với `products`.
- Menu `primary` quản lý navigation chính.
- `Base.astro` có thể đọc menu `footer`; menu này chưa được khai báo trong seed hiện tại và cần tạo trong Admin hoặc bổ sung vào seed.

### Media

Image field là object media, không phải URL string. Frontend render ảnh CMS bằng:

```astro
<Image image={entry.data.image} />
```

Alt text được quản lý cùng media trong EmDash. Seed hiện có alt cho toàn bộ ảnh mẫu.

## D1/R2 bindings

Bindings nằm trong `wrangler.jsonc` và phải khớp với `astro.config.mjs`:

| Binding | Cloudflare resource | Resource name |
| --- | --- | --- |
| `DB` | D1 database | `lumicasa` |
| `MEDIA` | R2 bucket | `lumicasa` |

EmDash được cấu hình như sau:

```js
emdash({
  database: d1({ binding: "DB", session: "auto", coalesce: true }),
  storage: r2({ binding: "MEDIA" }),
})
```

D1 lưu schema, content, menu, settings và auth records. R2 lưu file media; D1 chỉ giữ metadata/reference của media. Tên binding và resource identifier không phải mật khẩu, nhưng credential dùng để truy cập Cloudflare vẫn phải nằm ngoài repository.

## Data flow

```text
Admin chỉnh sửa và publish content
              │
              ├── Structured content, menu, settings ──> D1
              └── Media binary ────────────────────────> R2
                                                         │
Browser request ──> Cloudflare Worker/Astro route        │
                         │                                │
                         ├── getEmDashEntry/Collection ───┘
                         ├── Base.astro + components
                         └── SSR HTML trả về browser
```

Ví dụ trang Products:

1. Admin publish một Product và upload ảnh.
2. EmDash ghi dữ liệu Product vào D1, file ảnh vào R2.
3. `src/pages/products.astro` gọi `getEmDashCollection("products")` với `status: "published"`.
4. Route truyền từng entry vào `ProductCard.astro`.
5. `ProductCard` render nội dung và `<Image image={product.data.image} />`.

Site Settings và menu được query trong `Base.astro`. Query có cache hint được đăng ký với Astro cache khi cache được bật.

## Build và deploy qua Cloudflare Dashboard

### Kiểm tra trước deploy

```bash
npm run typecheck
npm run build
```

### Kết nối Git repository

Việc deploy production được thực hiện trên Cloudflare Dashboard, không đăng nhập hoặc chạy Wrangler CLI thủ công trên máy local:

1. Mở **Cloudflare Dashboard → Workers & Pages**.
2. Chọn Worker hiện có, sau đó mở **Settings → Builds**.
3. Chọn **Connect** và kết nối GitHub repository của project.
4. Chọn production branch `main`.
5. Root directory để `/` vì project nằm tại repository root.
6. Đảm bảo tên Worker trên Dashboard khớp với `name` trong `wrangler.jsonc`.

Build settings:

| Setting | Giá trị |
| --- | --- |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Deploy command trên được **Cloudflare Workers Builds tự chạy trong hệ thống build**, không phải lệnh người phát triển chạy trên máy local. Cloudflare quản lý build token của Git integration; token không được ghi vào repository.

### Cấu hình D1/R2 bindings trên Dashboard

Trong Worker, mở **Settings → Bindings** và xác nhận:

| Binding type | Variable name | Resource |
| --- | --- | --- |
| D1 database | `DB` | D1 database `lumicasa` |
| R2 bucket | `MEDIA` | R2 bucket `lumicasa` |

Tên binding phải khớp `astro.config.mjs` và `wrangler.jsonc`. Không dùng D1/R2 preview chung với production nếu sau này bật preview deployments.

### Cấu hình production secret trên Dashboard

1. Mở Worker → **Settings → Variables and Secrets**.
2. Chọn **Add**.
3. Chọn type **Secret**.
4. Variable name: `EMDASH_ENCRYPTION_KEY`.
5. Nhập giá trị key vào Dashboard và chọn **Deploy** để áp dụng.

Không dùng type plaintext variable cho encryption key. Sau khi lưu, Dashboard không hiển thị lại giá trị secret; cần backup key trong secret manager riêng.

### Deploy Worker

Commit và push thay đổi lên branch `main`:

```bash
git push origin main
```

Cloudflare tự động build và deploy. Theo dõi kết quả tại **Worker → Deployments → Build history**. Dữ liệu trong `.wrangler/state/` không được upload lên production.

Sau deploy:

1. Mở public URL trong cửa sổ ẩn danh.
2. Hoàn tất setup Admin bằng passkey nếu đây là database mới.
3. Xác nhận D1 có content thật và R2 có media thật.
4. Kiểm tra `/`, `/products`, `/services`, `/contact` và `/_emdash/admin`.
5. Upload một media, publish một entry thử nghiệm rồi kiểm tra public site.
6. Xóa hoặc unpublish nội dung thử nghiệm trước khi bàn giao.

## Production URL

**Trạng thái: chưa xác nhận production-ready.**

- Public URL: `Chưa cập nhật sau khi xác minh deployment`
- Admin URL: `<production-url>/_emdash/admin`

Không điền URL suy đoán. Chỉ cập nhật mục này sau khi URL mở được ở cửa sổ ẩn danh, bindings đúng, D1/R2 có dữ liệu thật và Admin yêu cầu xác thực.

## Known limitations

- Production URL và quy trình production smoke test chưa được xác nhận trong README này.
- Worker production cần được cấp `EMDASH_ENCRYPTION_KEY`; secret không nằm trong repository.
- Menu `footer` đang được layout query nhưng chưa có trong `seed/seed.json`; môi trường mới sẽ cần tạo menu này hoặc bổ sung seed.
- Form Contact chỉ validate, redirect và hiển thị feedback; chưa gửi email và chưa lưu lead.
- Chưa có trang chi tiết riêng cho Product hoặc Service.
- Layout các route chính được cố định trong Astro; Admin quản lý nội dung nhưng không phải page builder.
- Route `[slug].astro` render mọi entry `pages` đã publish. Cần xóa/unpublish page placeholder như `test` trước production.
- Canonical hiện chỉ được xử lý rõ ràng cho page động qua `getSeoMeta()`; các route cố định cần được rà soát SEO lần cuối trước production.
- Nếu Hero hoặc page intro bắt buộc bị unpublish, route vẫn có thể render nhưng cấu trúc heading sẽ không đầy đủ; cần giữ các entry hệ thống này ở trạng thái published.
- Sandboxed plugins/Worker Loader chưa bật vì không nằm trong phạm vi hiện tại và có thể yêu cầu Workers paid plan.

## Security notes

- Không commit `.env`, `.dev.vars`, Cloudflare token, OAuth secret hoặc plugin API key.
- Không đưa credential thật vào README, tài liệu AI usage, video hoặc screenshot.
- Không log form data, auth token hoặc secret ra console.
- Admin production hiện dự kiến dùng passkey mặc định của EmDash. Nếu chuyển sang Cloudflare Access, phải bảo vệ toàn bộ `/_emdash/*`, không chỉ `/_emdash/admin/*`.
- Backup `EMDASH_ENCRYPTION_KEY` trong secret manager riêng; D1 backup không chứa key này.

## Project structure

```text
seed/seed.json             Content model và dữ liệu mẫu
astro.config.mjs           Astro + EmDash + D1/R2 integration
wrangler.jsonc             Worker, D1/R2 bindings và cron
emdash-env.d.ts            Generated collection types
src/worker.ts              Cloudflare Worker entry point
src/layouts/Base.astro     Shared layout, menus, metadata và EmDash wiring
src/pages/                 Server-rendered routes
src/components/            UI components
src/css/                   Global và page-specific styles
docs/design.md             Ghi chú thiết kế/content model
docs/ai-usage.md           Phạm vi hỗ trợ bởi AI
```

## Commands

| Command | Mục đích |
| --- | --- |
| `npm run dev` | Chạy local site và Admin |
| `npx emdash types` | Regenerate `emdash-env.d.ts` từ site đang chạy |
| `npm run typecheck` | Kiểm tra Astro/TypeScript |
| `npm run build` | Build Cloudflare SSR output |
| `git push origin main` | Kích hoạt Cloudflare Workers Builds sau khi commit |

## Tài liệu

- [EmDash documentation](https://docs.emdashcms.com/)
- [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)
- [EmDash Cloudflare deployment](https://docs.emdashcms.com/deployment/cloudflare/)
- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
