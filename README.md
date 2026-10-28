# LUMI CASA — EmDash Smart Home

Website Smart Home được chuyển đổi từ một file HTML tĩnh sang Astro + EmDash CMS và triển khai theo kiến trúc Cloudflare Workers, D1 và R2.

> Trạng thái hiện tại: content model đã được thiết kế; `seed/seed.json` và frontend vẫn đang trong quá trình chuyển đổi từ Starter template.

## 1. Mục tiêu

- Giữ bốn khu vực chính: Trang chủ, Sản phẩm, Dịch vụ và Liên hệ.
- Cho phép quản trị Product, Service, nội dung giới thiệu trang, Hero/CTA, thông tin liên hệ và menu từ EmDash Admin.
- Lưu dữ liệu CMS trong Cloudflare D1 và media trong Cloudflare R2 ở production.
- Không hard-code danh sách Product hoặc Service trong component.
- Hỗ trợ CRUD, draft/published, responsive và xử lý dữ liệu rỗng an toàn.
- Form liên hệ có validation và feedback khi submit; không bắt buộc gửi email hoặc lưu lead.

## 2. Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend/CMS | Astro 7, EmDash 1.3 |
| Admin UI | EmDash Admin |
| Production runtime | Cloudflare Workers |
| Database | Cloudflare D1 |
| Media storage | Cloudflare R2 |
| UI tương tác | React 19 khi cần |
| Ngôn ngữ | TypeScript, JavaScript, HTML, CSS |

Project dùng server rendering với `output: "server"`. Nội dung CMS không dùng `getStaticPaths()`.

## 3. Kiến trúc

```text
EmDash Admin
├── Structured content ──> Cloudflare D1
├── Product/Service media ──> Cloudflare R2
└── Menu/Site Settings ──> Cloudflare D1

Astro server-rendered routes
├── Query content từ EmDash
├── Render media bằng <Image /> của emdash/ui
└── Trả HTML cho trình duyệt
```

Bindings được dùng trong source:

| Binding | Resource | Tên hiện tại |
| --- | --- | --- |
| `DB` | Cloudflare D1 | `lumicasa` |
| `MEDIA` | Cloudflare R2 | `lumicasa` |

Các binding được khai báo trong `wrangler.jsonc` và được truyền vào EmDash trong `astro.config.mjs`.

## 4. Content model đã chốt

### Bước 1 — Site Settings

Dùng Site Settings built-in của EmDash:

| Field | Mục đích |
| --- | --- |
| `title` | Tên website |
| `tagline` | Tagline chung và nội dung ngắn ở footer |
| `logo` | Logo header |
| `favicon` | Favicon |
| SEO settings | Metadata mặc định |

Copyright footer được tạo từ năm hiện tại và `title`; không cần collection Footer riêng.

### Bước 2 — Hero/CTA trang chủ

Collection `hero_ctas`, dùng một entry có slug `homepage`.

| Field | Type | Ghi chú |
| --- | --- | --- |
| `badge` | `string` | Nhãn phía trên heading |
| `title` | `string` | Heading chính |
| `description` | `text` | Nội dung giới thiệu |
| `cta_buttons` | `repeater` | Danh sách nút CTA |
| `image` | `image` | Ảnh Hero quản lý qua Media/R2 |
| `stats` | `repeater` | Các số liệu bên dưới ảnh |

`cta_buttons` gồm:

| Subfield | Type | Ghi chú |
| --- | --- | --- |
| `label_template` | `string` | Hỗ trợ token, ví dụ `Xem {{countProduct}} sản phẩm` |
| `url` | `url` | URL tuyệt đối hoặc đường dẫn như `/products` |
| `variant` | `select` | `primary` hoặc `secondary` |

`stats` gồm:

| Subfield | Type | Ghi chú |
| --- | --- | --- |
| `value_template` | `string` | Ví dụ `{{countProduct}}`, `{{countService}}`, `24/7` |
| `label` | `string` | Ví dụ `Sản phẩm chủ lực` |

Các token động được frontend thay bằng dữ liệu query từ Product/Service. Token không hợp lệ được giữ nguyên để tránh lỗi trang.

### Bước 3 — Product

Collection `products`:

| Field | Type | Ghi chú |
| --- | --- | --- |
| `title` | `string` | Tên sản phẩm |
| `description` | `text` | Mô tả ngắn |
| `price` | `integer` | Giá VND, ví dụ `2490000` |
| `image` | `image` | Ảnh qua Media/R2 |
| `sort_order` | `integer` | Thứ tự hiển thị |

Collection supports:

```text
drafts, revisions
```

Không tạo field `publish`; trạng thái draft/published do EmDash quản lý. `entry.id` là slug dùng cho URL/định danh, còn `entry.data.id` là ULID dùng cho API như taxonomy.

#### Product Category taxonomy

Taxonomy `product_category` được gắn với collection `products`. Taxonomy này được dùng thật để admin tạo, đổi tên và tái sử dụng nhóm cho nhiều sản phẩm.

| Slug | Label |
| --- | --- |
| `trung-tam` | Trung tâm điều khiển |
| `dieu-khien` | Điều khiển / công tắc |
| `an-ninh` | An ninh |
| `cam-bien` | Cảm biến / môi trường |

Quy ước mỗi Product chọn một Product Category. Khi render term của một Product, frontend gọi `getEntryTerms("products", product.data.id, "product_category")`.

Không tạo taxonomy Tag vì giao diện và yêu cầu hiện tại không sử dụng tag.

### Bước 4 — Service

Collection `services`:

| Field | Type | Ghi chú |
| --- | --- | --- |
| `title` | `string` | Tên dịch vụ |
| `description` | `text` | Mô tả dịch vụ |
| `image` | `image` | Một ảnh đại diện qua Media/R2 |
| `features` | `repeater` | Danh sách bullet |
| `sort_order` | `integer` | Thứ tự hiển thị |

`features` có một subfield:

| Subfield | Type |
| --- | --- |
| `text` | `string` |

Collection supports:

```text
drafts, revisions
```

Không có `icon_key`, `featured` hoặc field `publish`. Tất cả Service đã published được hiển thị theo `sort_order`.

### Bước 5 — Page intro/settings

Collection `pages` quản lý phần heading/intro của các route có layout cố định.

| Field | Type | Ghi chú |
| --- | --- | --- |
| `title` | `string` | Heading của trang hoặc section chính |
| `badge_template` | `string`, optional | Có thể dùng token như `{{countService}} dịch vụ cụ thể` |
| `description` | `text` | Mô tả dưới heading |

Collection supports:

```text
drafts, revisions, seo
```

Các entry dự kiến:

| Entry slug | Nơi sử dụng |
| --- | --- |
| `home` | Heading phần sản phẩm nổi bật trên trang chủ |
| `products` | Intro route `/products` |
| `services` | Intro route `/services` |
| `contact` | Intro/thông tin dẫn nhập route `/contact` |

Layout của từng route được viết trong Astro; admin quản lý nội dung, không quản lý cấu trúc component. Dự án chưa cần page-builder `blocks`.

### Bước 6 — Contact information

Collection `contact_info`, dùng một entry có slug `main`.

| Field | Type |
| --- | --- |
| `badge` | `string` |
| `title` | `string` |
| `description` | `text` |
| `address` | `text` |
| `hotline` | `string` |
| `email` | `string` |
| `working_hours` | `string` |

Form liên hệ được viết cố định trong `ContactForm.astro`, gồm:

- Họ và tên — bắt buộc.
- Số điện thoại — bắt buộc, validate định dạng cơ bản.
- Loại nhà — không bắt buộc.
- Ngân sách dự kiến — không bắt buộc.
- Nhu cầu — bắt buộc.

Form có trạng thái đang gửi, lỗi validation và thông báo thành công. Core scope không gửi email và không lưu lead.

### Bước 7 — Menu

Dùng Menu built-in của EmDash với menu `primary`:

| Label | URL |
| --- | --- |
| Trang chủ | `/` |
| Sản phẩm | `/products` |
| Dịch vụ | `/services` |
| Liên hệ | `/contact` |

Header query menu từ EmDash; active state được xác định từ URL hiện tại.

## 5. Route và nguồn dữ liệu

| Route | Nguồn dữ liệu |
| --- | --- |
| `/` | `hero_ctas/homepage`, `pages/home`, Products, Services count, primary menu, Site Settings |
| `/products` | `pages/products`, Products, Product Category taxonomy, primary menu, Site Settings |
| `/services` | `pages/services`, Services, primary menu, Site Settings |
| `/contact` | `pages/contact`, `contact_info/main`, primary menu, Site Settings |

Product và Service được query theo `sort_order`. Chỉ entry published xuất hiện ở public site. Giao diện phải xử lý collection rỗng, field optional, ảnh thiếu và entry bị xóa mà không crash.

## 6. Dữ liệu mẫu bắt buộc

### Products

| Product | Category | Price |
| --- | --- | ---: |
| Lumi Hub One | Trung tâm điều khiển | 2.490.000đ |
| Lumi Touch S | Điều khiển / công tắc | 1.290.000đ |
| Lumi Guard Cam | An ninh | 1.890.000đ |
| Lumi Air Sense | Cảm biến / môi trường | 990.000đ |

### Services

1. Khảo sát & tư vấn.
2. Thiết kế kịch bản Smart Home.
3. Lắp đặt thiết bị.
4. Tích hợp an ninh.
5. Bảo trì & nâng cấp.
6. Hỗ trợ từ xa.

Ảnh Product/Service phải được quản lý qua EmDash Media và lưu bằng R2 ở production; component không hard-code URL Pexels.

## 7. Chạy local

### Yêu cầu

- Node.js `>=22.23.4`.
- npm `>=9.6.5`.
- Git.
- Cloudflare Wrangler được cài qua dependencies của project.

### Cài đặt và chạy

```bash
npm install
npm run dev
```

Địa chỉ mặc định:

- Website: `http://localhost:4321`
- EmDash Admin: `http://localhost:4321/_emdash/admin`

`npm run dev` sử dụng D1/R2 local do Cloudflare runtime mô phỏng. Dữ liệu local nằm trong `.wrangler/state/` và không thay đổi D1/R2 production.

File `.env` chứa `EMDASH_ENCRYPTION_KEY` cho local development. Không commit hoặc công khai giá trị này.

## 8. Seed và schema

Schema và dữ liệu mẫu được khai báo tại `seed/seed.json`, được chọn bởi `package.json#emdash.seed`.

Seed chỉ tự áp dụng khi database còn trống và setup chưa hoàn tất. Sửa seed rồi restart/deploy không ghi đè database đã setup.

Để kiểm tra seed mà không thay đổi database:

```bash
npx emdash seed seed/seed.json --validate
```

Sau khi dev server chạy, regenerate types bằng:

```bash
npx emdash types
```

## 9. Build và deploy

```bash
npm run typecheck
npm run build
npm run deploy
```

`npm run deploy` build Astro và deploy Worker qua Wrangler. Lệnh này không copy database local lên D1 production. Ở database production mới, EmDash chạy core migrations và áp dụng seed trong lần setup đầu tiên.

Production URL: **Chưa cập nhật**.

Không commit API token, account credential, `.env`, `.dev.vars` hoặc encryption key.

## 10. Data flow cần demo

```text
Admin tạo/sửa Product
        ↓
EmDash ghi structured data vào D1
        ↓
Ảnh upload qua Media được lưu vào R2
        ↓
Route Astro gọi getEmDashCollection("products")
        ↓
Frontend render card và <Image image={product.data.image} />
        ↓
Create/Update/Publish/Delete phản ánh mà không sửa component
```

Quy trình tương tự áp dụng cho Service, Page intro, Hero/CTA, Contact Info và Menu.

## 11. Checklist nghiệm thu

- [ ] Hoàn thiện `seed/seed.json` theo content model trên.
- [ ] Regenerate `emdash-env.d.ts`.
- [ ] Refactor đủ bốn route chính.
- [ ] Header dùng Site Settings và EmDash Menu.
- [ ] Product/Service query từ EmDash, không dùng mảng hard-code.
- [ ] Product Category được quản lý bằng taxonomy và hiển thị trên card.
- [ ] Product/Service media được upload qua EmDash và đọc từ R2 ở production.
- [ ] CRUD Product/Service hoạt động và không crash khi dữ liệu rỗng/xóa.
- [ ] Draft/unpublished item không xuất hiện ở public site.
- [ ] Form Contact validate và có feedback.
- [ ] Responsive desktop/mobile.
- [ ] Title, meta description, heading và alt text hợp lý.
- [ ] `npm run typecheck` và `npm run build` thành công.
- [ ] Deploy Cloudflare Workers và cập nhật production URL.
- [ ] Bổ sung `docs/ai-usage.md` và video demo 5–7 phút.

## 12. Giới hạn đã chủ động chọn

- Không triển khai page-builder `blocks`; layout bốn route được cố định trong Astro để giữ scope rõ ràng.
- Không tạo taxonomy Tag vì chưa có chức năng sử dụng.
- Không lưu lead hoặc gửi email từ Contact form trong core scope.
- CTA phụ cố định trong từng layout có thể nằm trong component; Hero/CTA chính được quản lý qua `hero_ctas`.
- Sandboxed plugins bị tắt vì bài không yêu cầu tính năng trả phí.

## 13. Tài liệu tham khảo

- [EmDash Getting Started](https://docs.emdashcms.com/getting-started/)
- [EmDash Cloudflare Deployment](https://docs.emdashcms.com/deployment/cloudflare/)
- [EmDash Seed Files](https://docs.emdashcms.com/themes/seed-files/)
