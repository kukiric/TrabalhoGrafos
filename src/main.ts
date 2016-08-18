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

    // Deprecado: estrutura na exportação em "scripts" é mais simples e usável
    public static ImportaGrafoComplexo(caminho: string): Grafo {
        let arquivo = fs.readFileSync(caminho);
        let grafo: Grafo = null;
        let ok: boolean = false;
        xml2js.parseString(arquivo.toString(), function(err, dados) {
            if (err != null) {
                console.error("Erro na leitura do XML: " + err);
            }
            grafo = new Grafo();
            let grafoXml = dados["elementosGrafo.Grafo"];
            // Opções do grafo
            console.log("Dirigido: " + <boolean> grafoXml.dirigido);
            console.log("Ponderado: " + <boolean> grafoXml.ponderado);
            // Imprime a estrutura
            // console.log(JSON.stringify(grafoXml, null, "."));
            // Grava os vértices
            grafoXml.listaVertices[0]["elementosGrafo.Vertice"].forEach(vertice => {
                if (vertice["$"] != null) {
                    console.log("Vértice linkado ignorado");
                }
                else {
                    grafo.nos.push(new No(vertice.id, vertice.rotulo));
                }
            });
            ok = true;
        });
        while (!ok) {
            console.log("Esperando leitura do grafo terminar...");
        }
        return grafo;
    }
}

console.log("Importando XML...");
let grafo = Grafo.ImportaGrafoComplexo("grafo1.xml");
console.log(JSON.stringify(grafo, null, "."));
