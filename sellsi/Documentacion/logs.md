tengo un problema algunas secciones de mi codigo /src
utilizan thumbnails
pero quiero implementar un fallback, en caso de que no encuentre alguna de las 4 thumbnails presentes, que utilice la imagen principal sin thumbnail.

actualmente cuando una imagen no tiene thumbnail se esta mostrando un BrokeImageIcon, en vez de mostrar la imagen principal
contexto: la imagen principal por ejemplo se utiliza en product header para que entiendas como se construye la ruta
necesito que hagas un analisis super profundo de todos los hooks encargados de esto, react query todo lo que podria influir para asi proponer este fix