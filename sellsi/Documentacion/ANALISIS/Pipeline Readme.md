Voy a darte una carpeta que contiene archivos `.js` y `.jsx` de un módulo. Analiza todos los archivos en esa carpeta y genera un archivo `README.md` ubicado en la misma carpeta.

Este README debe documentar de manera clara, completa y ordenada el funcionamiento de esa carpeta para que cualquier desarrollador pueda entenderla sin leer el código fuente.

Incluir:

1. **Resumen funcional del módulo**  
   - Qué problema resuelve este módulo o carpeta dentro del proyecto.  
   - Qué función cumple a alto nivel.

2. **Listado de archivos**  
   - Tabla con nombre de archivo, tipo (componente, hook, helper, etc.), y una descripción corta de lo que hace.

3. **Relaciones internas del módulo**  
   - Cómo se relacionan los archivos entre sí.  
   - Qué archivo importa a cuál, qué componentes renderizan a otros, qué hooks usan otros archivos.  
   - Puede representarse con bullets, diagramas de texto o estructuras en árbol.

4. **Props de los componentes**  
   - Tabla con las props más relevantes de cada componente, su tipo, si es requerida y su descripción.

5. **Hooks personalizados**  
   - Qué hace cada uno.  
   - Qué estados y efectos maneja.  
   - Qué funciones retorna.  
   - Cómo deberían usarse.

6. **Dependencias externas e internas**  
   - Qué librerías externas se usan.  
   - Qué contextos o providers globales utiliza.  
   - Si importa módulos de fuera de la carpeta actual.

7. **Consideraciones técnicas y advertencias**  
   - Problemas conocidos, limitaciones, deudas técnicas o detalles importantes que alguien debe saber antes de modificar el módulo.

8. **Puntos de extensión o reutilización**  
   - Qué componentes, hooks o helpers están pensados para ser usados fuera del módulo.

9. **Ejemplos de uso**  
   - Cómo importar y usar uno o más componentes importantes del módulo.  
   - Incluye snippets simples y explicativos.

10. **Fecha de creación del README**  
   - Agrega la fecha de creación del archivo README.md al inicio del documento, en formato `dd/mm/yyyy`, cada vez que generes o actualices un README con esta plantilla.

Escribe todo esto en Markdown bien estructurado y legible, con encabezados `##`, tablas si es necesario, y un lenguaje claro, directo y profesional. Evita jergas innecesarias o explicaciones redundantes. El objetivo es que otro developer entienda el 90% del código leyendo solo este archivo.
Si las explicaciones se extienden mas de lo normal no importa, prefiero que haya "sobre texto explicartivo a que falte"
