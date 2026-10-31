# Following setup: https://docs.emdashcms.com/getting-started/

1. npm create emdash@latest -> deploy: Cloudflare workers, template: starter, disabled sandboxed plugins.

2. Create d1, r2 on cloudflare dashboard, then bind at wrangler.jsonc & astro.config.mjs

3. Read requirement:

- Can manage: product, service, site & page settings, header, footer

-> Content model:

- 1. HeroCTA: badge, title, description, ctaButtons, image, stats --> Manage hero/intro/CTA
     **AI asistant**: title(string), badge(string), description(string), cta_buttons(repeater) -> [{label, url, variant[primary|secondary]}], image(image), stats(repeater) -> [{value, label}]
- 2. Products: name, description, taxnomies (tag, category), price, image, sort_order, publish
- 3. Services: name, description, images, features, sort_order, publish
- 4. Pages: title, badge, description
- 5. Menu: built-in menu
- 6. ContactInfo: badge, title, description, adress, hotline, email, working_hour

==>

hero_ctas
├── badge (string)
├── title (string)
├── description (text)
├── cta_buttons (repeater)
│ ├── label_template (string)
│ ├── url (url)
│ └── variant (select: primary | secondary)
├── image (image)
└── stats (repeater)
├── value_template (string)
└── label (string)

products
├── title (string)
├── description (text)
├── price (integer)
├── image (image)
└── sort_order (integer)
supports: drafts, revisions

Taxnomy
product_category
├── Trung tâm điều khiển
├── Điều khiển / công tắc
├── An ninh
└── Cảm biến / môi trường

services
├── title (string)
├── description (text)
├── image (image)
├── features (repeater)
│ └── text (string)
└── sort_order (integer)
supports: drafts, revisions

pages
├── title (string)
├── badge_template (string, optional)
├── description (text)
├── cta_title (string, optional)
├── cta_description (text, optional)
├── cta_label (string, optional)
└── cta_url (url, optional)
supports: drafts, revisions, seo

contact_info
├── badge (string)
├── title (string)
├── description (text)
├── address (text)
├── hotline (string)
├── email (string)
└── working_hours (string)

Menu built-in
Trang chủ → /
Sản phẩm → /products
Dịch vụ → /services
Liên hệ → /contact

Site Settings ( built-in)
title
tagline
logo
favicon
SEO

# thiết kế kiến trúc dự án

src

- layouts
- pages
- css
- index.css ( import )
- [slug]/index.css
- utils

=> chốt lại thiết kế
5 collection:

- hero_cta: title, description, image, badge, cta_buttons, stats
- product: title, description, image, price, sort_order
- service: title, description, image, features, sort_order
- page: title, badge, description
- contact_info: title, badge, description, address, hotline, email, working_hour
