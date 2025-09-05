1.-Policies de cart_items:
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

2.-Policies de carts:
Success. No rows returned
