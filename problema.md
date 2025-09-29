Actualmente este programa de Python lo que hace es descargar 13 archivos de un sitio web (EXCEL)
La idea de estos archivos es que despues son procesados en un Excel que tengo con yo, que utiliza Macros (macroexcel.bas)
Cual es el problema:
1.-El excel actualmente procesa los archivos que se guardan en la carpeta, con nombres ya definidos: (
Scotiabank:
Scotiabank N°3
Scotiabank N°1
Scotiabank N°2
Scotiabank N°4
Scotiabank N°5

BCI:
BCI N°1
BCI N°2
BCI N°3

Santander:
Santander N°2
Santander N°3
Santander N°4
Santander N°1
)

El Bot de python cuando descarga los archivos, estos se descargan con otro nombre, nombre el cual actualmente haria que el Macro de excel no reconozca.

entonces tengo el siguiente problema, que deberia hacer?

1.-Hacer que este Bot cuando descargue archivos, los renombre a los nombre establecidos arriba?
2.-Hacer que el macro de excel sea mas robusto y no dependa del nombre del archivo, sino que simplemete abra todos los archivos dentro de la carpeta y analice la celda C8
3.-alguna otra alternativa que recomiendes?


