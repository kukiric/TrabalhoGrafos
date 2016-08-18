import xml2js = require("xml2js");
import util = require("util");
import fs = require("fs");

class Arco {
    public id: Number;
    public peso: Number;
    public nos: No[];
}

class No {
    public id: Number;
    public nome: String;
    public arcos: Arco[];

    public constructor(id: Number, nome: String) {
        this.id = id;
        this.nome = nome.toString();
    }
}

class Grafo {
    public nos: No[];
    public arcos: Arco[];

    public constructor() {
        this.nos = new Array();
        this.arcos = new Array();
    }

    public static ImportaGrafo(caminho: string): Grafo {
        let arquivo = fs.readFileSync(caminho);
        let grafo: Grafo = null;
        let ok: boolean = false;
        xml2js.parseString(arquivo.toString(), function(err, dados) {
            if (err != null) {
                console.error("Erro na leitura do XML: " + err);
            }
            ok = true;
        });
        while (!ok) {
            console.log("Esperando leitura do grafo terminar...");
        }
        return grafo;
    }
}

console.log("Importando XML...");
let grafo = Grafo.ImportaGrafo("grafo1.xml");
console.log(JSON.stringify(grafo, null, "."));
