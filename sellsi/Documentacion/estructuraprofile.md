## Estructura UI del componente `Profile`

El componente `Profile` es un orquestador que organiza la vista de perfil de usuario en contenedores jerárquicos y secciones modulares. Su estructura es la siguiente:

---

### 1. Contenedor Raíz

- Fragmento React (`<>...</>`)  
  Permite renderizar múltiples elementos hermanos.

---

### 2. Estado de Carga (`loading`)

- `<Box>` (Loading State)
  - Props: `display: flex`, `flexDirection: column`, `alignItems: center`, `justifyContent: center`, `minHeight: 50vh`, `gap: 2`
  - Hijos:
    - `<CircularProgress />` (Spinner de carga)
    - `<Typography>` (Texto: "Cargando perfil...")

---

### 3. Contenedor Principal de Perfil

- `<Box>`
  - Props: `p: 3`, `maxWidth: 1200`, `mx: 'auto'`, `pb: SPACING_BOTTOM_MAIN`
  - Hijos:
    - **Header de Perfil**
    - **Grid Principal (Paper)**
    - **Modales**

---

#### 3.1 Header de Perfil

- `<Box>`
  - Props: `display: flex`, `alignItems: center`, `mb: 4`
  - Hijos:
    - **Avatar con Tooltip**
      - `<Tooltip>` ("Cambiar imagen de perfil")
        - `<Box>` (position: relative, mr: 2)
          - `<Avatar>` (Imagen, iniciales o icono)
          - `<Box>` (Icono de cámara, position: absolute, bottom: 0, right: 0)
    - **Nombre de Usuario**
      - `<Box>` (display: flex, alignItems: center)
        - Si está editando:
          - `<TextField>` (Edición de nombre)
        - Si no:
          - `<Typography>` (Nombre)
            - `<IconButton>` (Editar nombre)

---

#### 3.2 Grid Principal de Secciones

- `<Paper>`
  - Props: `p: 0`, `bgcolor: #fff`, `boxShadow: 2`, `borderRadius: 3`, `mb: 4`
  - Hijo:
    - `<Box>` (Grid)
      - Props: `display: grid`, `gridTemplateColumns: 'repeat(2, 1fr)'`, `gridTemplateRows: 'repeat(2, auto)'`, `gap: 3`, media queries para mobile
      - Hijos (orden visual):
        1. `<CompanyInfoSection />` (Columna 1, Fila 1)
        2. `<TransferInfoSection />` (Columna 2, Fila 1)
        3. `<ShippingInfoSection />` (Columna 1, Fila 2)
        4. `<TaxDocumentSection />` (Columna 2, Fila 2)

---

#### 3.3 Modales

- `<ChangePasswordModal />`
  - Props: `open`, `onClose`, `showBanner`, `onPasswordChanged`

- `<ProfileImageModal />`
  - Props: `open`, `onClose`, `onImageChange`, `onSaveImage`, `currentImageUrl`, `userInitials`

---

### Resumen Jerárquico

- Fragmento React
  - Si `loading`:
    - Box (Spinner + Texto)
  - Si no:
    - Box (Contenedor principal)
      - Header (Avatar + Nombre)
      - Paper (Grid 2x2)
        - CompanyInfoSection
        - TransferInfoSection
        - ShippingInfoSection
        - TaxDocumentSection
      - ChangePasswordModal
      - ProfileImageModal

---

### Notas

- Cada sección modular (CompanyInfoSection, TransferInfoSection, etc.) es responsable de su propia UI interna y lógica de campos.
- El layout es responsivo: el grid pasa de 2x2 a 1x4 en pantallas pequeñas.
- Los modales se renderizan siempre, pero se muestran según el estado local.
