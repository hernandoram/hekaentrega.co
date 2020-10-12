importar { grados , PDFDocument , rgb , StandardFonts } desde ' pdf-lib '         ;
 
//  Esto debería ser un Uint8Array o ArrayBuffer
//  Estos datos se pueden obtener de diferentes maneras
//  Si estás ejecutando en un entorno Node, puedes usar fs.readFile ()
//  En el navegador, puede hacer una llamada fetch () y usar res.arrayBuffer ()
const existentePdfBytes = hkj;   
 
//  Cargue un documento PDF de los bytes PDF existentes
const pdfDoc = esperar PDFDocument . carga ( existentePdfBytes )    
 
//  Incrustar la fuente Helvetica
const helveticaFont = espera pdfDoc . embedFont ( StandardFonts . Helvetica )    
 
//  Obtenga la primera página del documento
páginas const = pdfDoc . getPages ( )   
const firstPage =  páginas [ 0 ]  
 
//  Obtenga el ancho y el alto de la primera página
const { ancho , alto } = primera página . getSize ( )      
 
//  Dibuja una cadena de texto diagonalmente en la primera página
Primera página . drawText ( '¡ Este texto se agregó con JavaScript! ' , { 
  x : 5 , 
  y :  altura  / 2 + 300 ,   
  tamaño : 50 , 
  fuente :  helveticaFont ,
  de color : rgb ( 0 . 95 , 0 . 1 , 0 . 1 ) ,   
  rotar : grados ( - 45 ) , 
} )
 
 
//  Serializar el PDFDocument a bytes (un Uint8Array)
const pdfBytes = espera pdfDoc . guardar ( )    
 
//  Por ejemplo, `pdfBytes` puede ser:
//    • Escrito en un archivo en Node
//    • Descargado desde el navegador
//    • Representado en un <iframe>