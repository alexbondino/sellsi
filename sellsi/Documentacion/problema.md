Crea una regla de ESLint personalizada que complemente a eslint-plugin-react-hooks. 
La regla debe:
1. Analizar llamadas a useEffect, useMemo y useCallback.
2. Revisar el array de dependencias.
3. Marcar error si hay dependencias usadas en la función pero no incluidas en el array.
4. Marcar warning si hay dependencias en el array que no se usan dentro del callback.
5. Marcar warning si hay valores inline (objetos, arrays o funciones anónimas) dentro del array de dependencias. 
   Ejemplo incorrecto:
      useEffect(() => {...}, [{}]);
      useEffect(() => {...}, [() => {}]);
   Ejemplo correcto:
      const opts = {};
      useEffect(() => {...}, [opts]);

El resultado debe ser un archivo en Node.js que exporte la regla como plugin ESLint estándar, 
listo para integrarse en un proyecto. 
El archivo debe estar estructurado como 'eslint-plugin-custom-hooks/index.js' con module.exports.
