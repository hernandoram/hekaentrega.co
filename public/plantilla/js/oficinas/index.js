import { db, collection, query, where, getDocs } from "/js/config/initializeFirebase.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { inputDoc, oficinaController } from "./control.js";


let listaO=[]

export async function cargarOficinas(e) {
  const cargador = new ChangeElementContenWhileLoading(e.target);
  cargador.init();
  const valDoc = inputDoc.val().trim();
  let ref = collection(db, "oficinas");

  if (valDoc) {
      ref = query(ref, where("numero_documento", "==", valDoc));
  }

  const listaOficinas = await getDocs(ref).then(q => q.docs.map(d => {
      const data = d.data();
      data.id = d.id;
      return data;
  }));
  
  listaO = listaOficinas;

  console.log(listaOficinas);
  oficinaController.agregarTodas = listaOficinas;
  cargador.end();
}





export async function descargarInformeOficinasAdm(e) {
    const datosDescarga = {
      nombres: "Nombres",
      apellidos: "Apellidos",
      tipo_documento: "Tipo de documento",
      numero_documento: "Número documento",
      celular: "Celular 1",
      celular2: "Celular 2",
      centro_de_costo: "Centro de costo",
      correo: "Correo",
      nombre_empresa: "Nombre de la empresa"
    }
  
    const normalizeObject = (campo, obj) => {
      if(!obj) return "No aplica";
      return obj[campo];
    }
  
    const transformDatos = (obj) => {
      const res = {};
      for(let campo in datosDescarga) {
        const resumen = campo.split(".")
        if(resumen.length > 1) {
          let resultante = obj;
          resumen.forEach(r => {
            resultante = normalizeObject(r, resultante)
          });
          res[datosDescarga[campo]] = resultante
  
        } else {
          res[datosDescarga[campo]] = obj[campo];
        }
      }
  
      if(obj.objetos_envio)
      res["Cosas que envía"] = obj.objetos_envio.join();
  
      return res;
    }
  
    const loader = new ChangeElementContenWhileLoading(e.target);
    loader.init();
  
    await getDocs(collection(db, "oficinas")).then((querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push(transformDatos(doc.data()));
      });
      crearExcel(data, "informe Oficinas");
      loader.end();
    });
  }