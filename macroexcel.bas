Sub ProcesarTodosContratos()
    ' ====== PARTE 1: Procesar ContratoSwapTasas ======
    Dim wsContratos As Worksheet
    Dim directorio As String
    Dim archivoSwap As String
    Dim wbSwap As Workbook
    Dim wsSwap As Worksheet
    Dim codigosHoja As Range, codigosSwap As Range, montosSwap As Range
    Dim i As Long, matchIndex As Variant
    Dim codigoActual As Variant
    Dim libroOriginal As Workbook
    Dim hojaOriginal As Worksheet

    Set libroOriginal = ThisWorkbook
    Set hojaOriginal = libroOriginal.ActiveSheet

    Application.ScreenUpdating = False
    Application.EnableEvents = False

    Set wsContratos = libroOriginal.Sheets("Contratos")

    ' Validar K14
    If wsContratos.Range("K14").Value <> "OK" Then
        MsgBox "Validación de Directorio tiene que estar en OK.", vbCritical
        GoTo Salir
    End If

    ' Obtener directorio de I14
    directorio = wsContratos.Range("I14").Value
    If Right(directorio, 1) <> "\" Then directorio = directorio & "\"
    archivoSwap = directorio & "ContratoSwapTasas.xlsx"

    ' Verificar existencia de archivo
    If Dir(archivoSwap) = "" Then
        MsgBox "No se encontró el archivo ContratoSwapTasas.xlsx en la ubicación indicada.", vbCritical
        GoTo Salir
    End If

    ' Abrir archivo y hoja correspondiente de forma oculta
    Set wbSwap = Workbooks.Open(archivoSwap, ReadOnly:=True, UpdateLinks:=False)
    Set wsSwap = wbSwap.Sheets("Cartera de Swaps")

    Set codigosSwap = wsSwap.Range("D7:D18")
    Set montosSwap = wsSwap.Range("P7:P18")
    Set codigosHoja = wsContratos.Range("B13:B24")

    ' Limpiar montos previos en C13:C24
    wsContratos.Range("C13:C24").ClearContents

    ' Para cada código de la hoja activa, buscar si existe en el archivo de swap y pegar monto correspondiente
    For i = 1 To codigosHoja.Rows.Count
        codigoActual = codigosHoja.Cells(i, 1).Value
        If Not IsEmpty(codigoActual) Then
            matchIndex = Application.Match(codigoActual, codigosSwap, 0)
            If Not IsError(matchIndex) Then
                wsContratos.Range("C13").Offset(i - 1, 0).Value = montosSwap.Cells(matchIndex, 1).Value
            Else
                wsContratos.Range("C13").Offset(i - 1, 0).Value = "" ' Deja en blanco si no hay match
            End If
        End If
    Next i

    wbSwap.Close SaveChanges:=False

    ' ====== PARTE 2: Procesar los 12 archivos restantes, renombrando y reemplazando ======
    Dim archivo As String
    Dim fso As Object, carpeta As Object, archivoItem As Object
    Dim wbExt As Workbook
    Dim wsSwapExt As Worksheet
    Dim nombreC8 As String
    Dim flujoA As Variant, flujoB As Variant
    Dim rangoOrigenA As String, rangoDestinoA As String
    Dim rangoOrigenB As String, rangoDestinoB As String
    Dim nuevoNombre As String
    Dim mapeo As Object
    Dim rutaOriginal As String, rutaNuevo As String

    Set mapeo = CreateObject("Scripting.Dictionary")
    ' nombre_c8 : Array(rangoOrigenA, rangoDestinoA, rangoDestinoB, nuevoNombre)
    mapeo.Add "Scotiabank N°3", Array("B6:N18", "B422:N434", "B439:N451", "Scotiabank 3")
    mapeo.Add "BCI N°1", Array("B6:N26", "B34:N54", "B59:N79", "BCI 1")
    mapeo.Add "Scotiabank N°1", Array("B6:N26", "B326:N346", "B351:N371", "Scotiabank 1")
    mapeo.Add "Santander N°2", Array("B6:N22", "B214:N230", "B235:N251", "Santander 2")
    mapeo.Add "Scotiabank N°2", Array("B6:N22", "B378:N394", "B399:N415", "Scotiabank 2")
    mapeo.Add "BCI N°2", Array("B6:N22", "B86:N102", "B107:N123", "BCI 2")
    mapeo.Add "Scotiabank N°4", Array("B6:N18", "B458:N470", "B475:N487", "Scotiabank 4")
    mapeo.Add "Santander N°3", Array("B6:N18", "B258:N270", "B275:N287", "Santander 3")
    mapeo.Add "Santander N°4", Array("B6:N16", "B294:N304", "B309:N319", "Santander 4")
    mapeo.Add "BCI N°3", Array("B6:N18", "B130:N140", "B145:N155", "BCI 3")
    mapeo.Add "Scotiabank N°5", Array("B6:N16", "B494:N504", "B509:N519", "Scotiabank 5")
    mapeo.Add "Santander N°1", Array("B6:N26", "B162:N182", "B187:N207", "Santander 1")

    Set fso = CreateObject("Scripting.FileSystemObject")
    Set carpeta = fso.GetFolder(directorio)

    For Each archivoItem In carpeta.Files
        archivo = archivoItem.Name
        ' Omitir el ContratoSwapTasas
        If LCase(archivo) <> LCase("ContratoSwapTasas.xlsx") And Right(archivo, 5) = ".xlsx" Then
            rutaOriginal = directorio & archivo
            Set wbExt = Workbooks.Open(rutaOriginal, ReadOnly:=False, UpdateLinks:=False)
            Set wsSwapExt = Nothing
            On Error Resume Next
            Set wsSwapExt = wbExt.Sheets("Swap")
            On Error GoTo 0
            If Not wsSwapExt Is Nothing Then
                nombreC8 = wsSwapExt.Range("C8").Value
                If mapeo.Exists(nombreC8) Then
                    rangoOrigenA = mapeo(nombreC8)(0)
                    rangoDestinoA = mapeo(nombreC8)(1)
                    rangoDestinoB = mapeo(nombreC8)(2)
                    nuevoNombre = mapeo(nombreC8)(3)
                    
                    ' Invertir el área de pegado para los contratos indicados
                    If nombreC8 = "Santander N°4" Or nombreC8 = "BCI N°3" Or nombreC8 = "Scotiabank N°5" Then
                        flujoA = wbExt.Sheets("Cupones Flujo A").Range(rangoOrigenA).Value
                        wsContratos.Range(rangoDestinoB).Value = flujoA ' Se pega en destino B

                        flujoB = wbExt.Sheets("Cupones Flujo B").Range(rangoOrigenA).Value
                        wsContratos.Range(rangoDestinoA).Value = flujoB ' Se pega en destino A
                    Else
                        flujoA = wbExt.Sheets("Cupones Flujo A").Range(rangoOrigenA).Value
                        wsContratos.Range(rangoDestinoA).Value = flujoA

                        flujoB = wbExt.Sheets("Cupones Flujo B").Range(rangoOrigenA).Value
                        wsContratos.Range(rangoDestinoB).Value = flujoB
                    End If

                    ' GUARDAR CON EL NUEVO NOMBRE
                    rutaNuevo = directorio & nuevoNombre & ".xlsx"
                    Application.DisplayAlerts = False
                    wbExt.SaveAs Filename:=rutaNuevo
                    Application.DisplayAlerts = True
                    wbExt.Close SaveChanges:=False
                    ' ELIMINAR EL ARCHIVO ORIGINAL SI EL NOMBRE CAMBIO
                    If StrComp(rutaOriginal, rutaNuevo, vbTextCompare) <> 0 Then
                        On Error Resume Next
                        Kill rutaOriginal
                        On Error GoTo 0
                    End If
                Else
                    wbExt.Close SaveChanges:=False
                End If
            Else
                wbExt.Close SaveChanges:=False
            End If
            Set wsSwapExt = Nothing
        End If
    Next archivoItem

Salir:
    libroOriginal.Activate
    hojaOriginal.Activate

    Application.EnableEvents = True
    Application.ScreenUpdating = True

    If wsContratos.Range("K14").Value = "OK" And Dir(archivoSwap) <> "" Then
        MsgBox "Procesamiento de todos los contratos completado.", vbInformation
    End If
End Sub
