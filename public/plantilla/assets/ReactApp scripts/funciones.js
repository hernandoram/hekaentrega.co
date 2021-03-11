function limpiarHtml(id){
    if(document.getElementById(id)){
document.getElementById(id).innerHTML="";
    }
}
function imprimirHtml(id,html){
    if(document.getElementById(id)){
    document.getElementById(id).innerHTML+=html;
    }
}
function ocultar(id){
    if(document.getElementById(id)){
    return document.getElementById(id).style.display='none';
    }
}
function activar(id){
    if(document.getElementById(id)){
    return document.getElementById(id).style.display='block';
    }
}


