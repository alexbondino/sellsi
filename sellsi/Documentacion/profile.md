en Profile:
1.-Tipo de Cuenta: Banco, el Banco debe ser un dropdown con las siguientes opciones:
Banco Itaú
Banco de Chile / Edwards-Citi
Banco Internacional
Banco Estado
Scotiabank
BCI / MACHBANK
CorpBanca
Banco Bice
HSBC Bank
Banco Santander
The Bank of Tokio Mitsubishi Ltda
Banco SudAmericano
Banco Security
Banco Falabella
Banco Ripley/Chek
Banco Rabobank
Banco Consorcio
Banco Paris
Scotiabank Azul
Banco del Desarrollo
Coopeuch
Tenpo Prepago S.A.
Prepago Los Héroes
Mercado Pago Emisora S.A.
TAPP Caja Los Andes
Transbank
La Polar Prepago
Copec Pay
Global66
Prex Chile S.A.
Fintual
Tanner

tal vez convenga crear un archivo constants?

2.-debajo de la box de Información de Transferencia, quiero añadir una box pequeña que diga: Documento Tributario y que su elemento diga: Tipo de Documento y a la derecha de este un dropdown con opcion para seleccion multiple, con 3 opciones que igual podrias ser agregardas a constants
Ninguno, Boleta, Factura
obviamente este por defecto viene en "Seleccionar"

3.-Documento Tributario debe tener un tooltip que diga: "Elige el tipo de documento que estás dispuesto a entregarle a tus compradores"

4.-La Información de Facturación debe permanecer OCULTA, esta solo se mostrara si Documento Tributario tiene a "Factura" activado

5.-en funcion de mi SQL actual, query.sql que columnas deberiamos agregar para este campo de Documento Tributario?

6.-Actualmente el perfil se guarda en Supabase solamente al darse Actualizar, pero quiero hacer una execpcion para dos cosas: a) Al abrir el modal de cambiar imagen de perfil y darle al boton "Guardar" este tiene que autoamticametne actualizarse en supabase y no depender del boton Actualizar. b) Al cambiar el nombre de mi cuenta "Editar nombre de usuario", al salir de modo edicion este igual debe guardarse automaticamente en supabase. Y obviamente el boton Actualizar ahora debe excluir a la imagen y nombre para no saturar las consultas