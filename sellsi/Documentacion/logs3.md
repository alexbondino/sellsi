1.-Mostrar policies (ejecuta en SQL editor):
[
  {
    "policyname": "cart_items_insert_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "qual": null,
    "with_check": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))"
  },
  {
    "policyname": "cart_items_update_owner",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "qual": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))",
    "with_check": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))"
  }
]

2.-(Opcional) también para carts:
Success. No rows returned


3.-
[
  {
    "policyname": "cart_items_insert_owner",
    "qual": null,
    "with_check": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))"
  },
  {
    "policyname": "cart_items_update_owner",
    "qual": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))",
    "with_check": "((EXISTS ( SELECT 1\n   FROM carts c\n  WHERE ((c.cart_id = cart_items.cart_id) AND (c.user_id = auth.uid())))) OR (auth.role() = 'service_role'::text))"
  }
]