const express = require("express");
const app = express();
const router = express.Router();
const puppeteer = require("puppeteer");
const interRouter = require("../controllers/inter");

router.get("/consultarGuia", (req, res) => {
    const url = "http://reportes.interrapidisimo.com/Reportes/ExploradorEnvios/ExploradorEnvios.aspx?keyInter=1)";
    (async () => {
    
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        console.log("accediendo a la página");
        await page.goto(url);
    
        console.log("Escribiendo el numero de guia");
        await page.type("#tbxNumeroGuia", req.query.guia);
        console.log("presionando el botón de buscar");
        await page.click("#btnShow");

        const tab = "#TabContainer2_body"
        await page.waitForSelector(tab);
        await page.waitForTimeout(1000);
        page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

        const estado = await page.evaluate(retornarEstado);
        const flujo = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel7_gvFlujoGuia");
        const novedades = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel18_gvNovedadesGuia");
        const caja = await page.evaluate(retornarDetalles, "#TabContainer2_TabPanel21_GridViewAfectCaja")

    
        console.log("Cerrando navegador")
        await browser.close();
       
        let respuesta = {
            estado, flujo, novedades, caja
        };

        console.log(req.query)

        switch(req.query.type) {
            case "estado":
                respuesta = estado
                break;
            case "flujo":
                respuesta = flujo
                break;
            case "novedades":
                respuesta = novedades
                break;
            case "caja":
                respuesta = caja
                break;
            default: 
                break;

        }

        console.log(respuesta)
        res.json(respuesta);
    })();
});

router.post("/crearGuia", interRouter.crearGuia)

function retornarEstado() {
    let info = new Object();
    const tds = document.querySelectorAll("#TabContainer2_TabPanel8 table table td");
    tds.forEach(td => {
        console.log(td);
        const label = td.firstElementChild.textContent;
        const input = td.getElementsByTagName("input")[0].value;
        info[label] = input;
    })
    return info;
};

function retornarDetalles(idTablaPanel) {
    let info = new Array();
    console.log(idTablaPanel)
    const rows = document.querySelectorAll(idTablaPanel + " tr");
    console.log(rows);
    if(!rows.length) return "Empty Data";

    const titles = new Array();
    const headTab = rows[0].children;

    for(let i = 0; i < headTab.length; i++) {
        titles.push(headTab[i].textContent);
    }



    for(let i = 1; i < rows.length; i++) {
        let mov = new Object()
        const bodyTab = rows[i].children;

        for(let j = 0; j < bodyTab.length; j++) {
            const value = bodyTab[j].textContent;
            mov[titles[j]] = value.trim();
        };

        info.push(mov);
    }

    return info;
};

module.exports = router