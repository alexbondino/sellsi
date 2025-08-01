En Marketplace, actualmente podemos agregar productos utilizando las ProductCardBuyerContext.jsx y el AddToCartModal.jsx
este modal tiene una especie de validacion del shipping con Profile.jsx

el problema es el siguiente:
En Marketplace, Searhbar.jsx, tenemos un boton que dice: Proveedores/Productos, cada vez que clickeo uno de esos botones me actualiza el marketplace, la grid entre los productos y proveedores, cada vez que vuelvo a Productos, hace que se carguen todos los datos de shipping, tal como puedes ver en LOGS, resulta que esto me parace poco optimo, poqrue si yo clickeo este boton un par de veces o navego entre la pagina hacia el marketpalce ir y volviendo, me satura el supabase de consultas...
mira los logs.md para que veas lo que te digo
encuentro super poco eficiente, esto no deberia consultarse a cada rato mientras navego o no?, osea tal vez si pero nose si de esa forma tan asi que cada vez que cambie a vista marketplace productos, se recarguen las consutlas
en los logs hice 2 iteraciones
Clickie 1 vez proveedores, 1 vez productos, 1 vez provedores y 1 vez productos (haciendo 2 cliclos), pero esto es un ejemplo simplemente, si yo voy y vuelvo a otra seccion de mi pagina ocurrira lo mismo

analisis PROFUNDO porfavor de toda esta situcacion, archivos, contexto, y despues planteamos una solucion robusta