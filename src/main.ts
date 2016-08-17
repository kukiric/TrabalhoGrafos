import xml2js = require("xml2js");
import util = require("util");
import fs = require("fs");

class Arco {
    public id: Number;
    public nos: No[];
}

class No {
    public id: Number;
    public nome: String;
    public arcos: Arco[];
}

class Grafo {
    public nos: No[];
    public arcos: Arco[];

    public static ImportaGrafo(caminho: string): Grafo {
        let arquivo = fs.readFileSync(caminho);
        xml2js.parseString(arquivo.toString(), function(err, result) {
            if (err != null) {
                console.error("Erro na leitura do XML: " + err);
            }
        });
        return null;
    }
}

console.log("Importando XML...");
let grafo = Grafo.ImportaGrafo("grafo1.xml");
