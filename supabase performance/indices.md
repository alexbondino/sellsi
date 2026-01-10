| sugerencia_sql                                                        | tabla            | columna_sin_indice   |
| --------------------------------------------------------------------- | ---------------- | -------------------- |
| CREATE INDEX CONCURRENTLY ON admin_audit_log (admin_id);              | admin_audit_log  | admin_id             |
| CREATE INDEX CONCURRENTLY ON admin_sessions (admin_id);               | admin_sessions   | admin_id             |
| CREATE INDEX CONCURRENTLY ON banned_ips (banned_by);                  | banned_ips       | banned_by            |
| CREATE INDEX CONCURRENTLY ON control_panel (procesado_por);           | control_panel    | procesado_por        |
| CREATE INDEX CONCURRENTLY ON invoices_meta (user_id);                 | invoices_meta    | user_id              |
| CREATE INDEX CONCURRENTLY ON invoices_meta (supplier_id);             | invoices_meta    | supplier_id          |
| CREATE INDEX CONCURRENTLY ON notifications (supplier_id);             | notifications    | supplier_id          |
| CREATE INDEX CONCURRENTLY ON orders (payment_reviewed_by);            | orders           | payment_reviewed_by  |
| CREATE INDEX CONCURRENTLY ON payment_releases (released_by_admin_id); | payment_releases | released_by_admin_id |
| CREATE INDEX CONCURRENTLY ON payment_releases (buyer_id);             | payment_releases | buyer_id             |
| CREATE INDEX CONCURRENTLY ON request_products (request_id);           | request_products | request_id           |
| CREATE INDEX CONCURRENTLY ON request_products (product_id);           | request_products | product_id           |
| CREATE INDEX CONCURRENTLY ON requests (buyer_id);                     | requests         | buyer_id             |
| CREATE INDEX CONCURRENTLY ON sales (user_id);                         | sales            | user_id              |
