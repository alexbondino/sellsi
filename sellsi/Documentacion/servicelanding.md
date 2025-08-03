# Estructura UI de ServicesSection

El componente `ServicesSection` está construido con Material UI y sigue una jerarquía clara de cajas (`Box`) y componentes anidados. A continuación se detalla la estructura principal:

---

## Jerarquía principal

- **Box principal (padre)**
  - Props: `ref={serviciosRef}`, estilos de fondo, padding, layout flex column.
  - Hijos:
    - **Box (contenedor interno)**
      - Contiene la sección de título, descripción y botones de servicios.
      - Hijos:
        - **Box (título y descripción)**
          - `Typography` (Título: "Nuestros Servicios")
          - `Typography` (Descripción general)
        - **Box (botones de servicios)**
          - Mapea cada servicio en un `Button` con:
            - `Box` (icono y título del servicio)
              - Icono
              - `Typography` (título)
            - `Typography` (descripción del servicio)
        - **Box (wizard/carrusel)**
          - Contiene el componente `Fade` que muestra el paso actual del carrusel.
          - Dentro de `Fade`, un `Box` que renderiza el contenido del servicio actual (`renderStep`).

---

## Resumen visual

- Box (padre)
  - Box (contenedor)
    - Box (título y descripción)
      - Typography (título)
      - Typography (descripción)
    - Box (botones de servicios)
      - Button (por cada servicio)
        - Box (icono y título)
          - Icono
          - Typography (título)
        - Typography (descripción)
    - Box (wizard/carrusel)
      - Fade
        - Box
          - renderStep (contenido dinámico del servicio)

---

Esta estructura permite un layout responsivo, con separación clara entre título, descripción, botones de navegación y el contenido dinámico del carrusel de servicios.
