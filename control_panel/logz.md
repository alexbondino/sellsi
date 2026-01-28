const { data: user } = await supabase.auth.getUser(); console.log(user);
supabase.js:105 [auth:getUser] real fetch
VM1721:1 {user: {…}}user: app_metadata: {provider: 'email', providers: Array(1)}aud: "authenticated"confirmed_at: "2026-01-23T16:22:24.5994Z"created_at: "2026-01-23T16:22:24.557756Z"email: "admin@sellsi.com"email_confirmed_at: "2026-01-23T16:22:24.5994Z"id: "837a3b22-953c-4be5-9a52-7e2640a6964d"identities: [{…}]is_anonymous: falselast_sign_in_at: "2026-01-23T16:28:01.823667Z"phone: ""role: "authenticated"updated_at: "2026-01-23T16:28:01.862672Z"user_metadata: {email_verified: true}[[Prototype]]: Object[[Prototype]]: Object
undefined


