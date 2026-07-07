<!--
  Suggested GitHub repo description:
  "Mi Tiendita — lightweight sales & inventory app for small shops: products, sales, finances and history. Vanilla JS + Supabase."
  Suggested topics: javascript, supabase, inventory-management, pos, small-business
  Suggested repo rename: mi-tiendita (fixes the "movile" typo and describes the product)
-->

# Mi Tiendita 🛒

**Lightweight sales and inventory app for small shops**, built as a mobile-first web app. Designed for the reality of small Peruvian businesses: no POS hardware, no monthly fees, no training needed — just open it on a phone and start selling.

## Modules

- **Inventory** — product catalog with photos (resized client-side before upload to keep storage light)
- **Sales** — register sales per destination/customer
- **Finances** — income tracking and monthly views
- **History** — full record of past operations

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (no framework), modular files per feature |
| Backend | Supabase (PostgreSQL + Storage) |
| Images | Client-side resize before upload to Supabase Storage |

The app is intentionally framework-free: it loads instantly on low-end phones and slow connections, which is where its users are.

## Project structure

```
├── index.html      # App shell
├── app.js          # Core logic and Supabase client
├── inventario.js   # Inventory module
├── ventas.js       # Sales module
├── finanzas.js     # Finances module
├── historial.js    # History module
├── mes.js          # Monthly views
├── ui.js           # UI helpers and rendering
└── supabase.js     # Data access layer
```

## Getting started

1. Create a [Supabase](https://supabase.com) project with the required tables and a public storage bucket.
2. Enable **Row Level Security** policies appropriate for your use case.
3. Set your project URL and publishable key in the Supabase configuration.
4. Serve the folder with any static server:
   ```bash
   npx serve .
   ```

## Author

**Frank Jáuregui** — [LinkedIn](https://linkedin.com/in/frank-jauregui) · [GitHub](https://github.com/FRANKEVIN25)
