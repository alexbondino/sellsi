Feature Flags es una funcionalidad que permite apagar otras funcionalidades a través del panel de control. Su principal uso es deshabilitar funcionalidades que pasarán a producción pero aún no están terminadas. Esto es especialmente útil para features que demoran mucho en desarrollarse.

Para utilizarla en el código, primero debemos crear una migración en supabase con el siguiente código y mergearla.

```bash
begin;

insert into control_panel.feature_flags (workspace, key, label, description, enabled)
values
  ('{nombre_unico_funcionalidad}', '{llave_unica_funcionalidad}', '{Nombre en Control Panel}', '{Descripción}', true),
on conflict (workspace, key) do nothing;

commit;
```

Esto creará una nueva fila en la sección de “Feature Flags” con el Label y un switch de activación/desactivación. Esto solo creará el switch. NO apagará ninguna funcionalidad aún.

```bash
## Caso de ejemplo

begin;

insert into control_panel.feature_flags (workspace, key, label, description, enabled)
values
	('my-offers', 'offers_enabled', 'Offers Enabled', '...', true)
on conflict (workspace, key) do nothing;

commit
```

Para poder apagar funcionalidades, es necesario aplicar Feature Flags al código. Para eso, se deben seguir los siguientes pasos:

```jsx
{/* Importamos el hook disponible en shared/hooks/useFeature Flag */}

import { useFeatureFlag } from '../../../../shared/hooks/useFeatureFlag';

{/* Utilizamos el hook de la siguiente manera */}

const { enabled: Enabled, loading: FlagLoading } = useFeatureFlag(
    {
      workspace: {workspace},
      key: {key},
      defaultValue: true, //
    }
    

{/* Aplicamos condicional a las funcionalidades. */}

{/* Caso Sidebar: Es necesario aplicar un filtro al menúItemsToDisplay */}
if (!Enabled && !FlagLoading) {
    menuItemsToDisplay = menuItemsToDisplay.filter(
      item => !(item.path && item.path.includes('/{item}'))
    );
  }
  
{/* Caso Botones: Aplicar a los botones de tal manera que se condicione el
uso del botón al feature flag */}

{isLoggedIn && !FlagLoading && Enabled && (
```

Esto debe realizarse para cada componente de la funcionalidad que necesite ser apagada por alguna razón.