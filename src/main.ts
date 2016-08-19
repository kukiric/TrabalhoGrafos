import electron = require("electron");
import xml2js = require("xml2js");
import util = require("util");
import fs = require("fs");

class Arco {
    public peso: number;
    public destino: Vertice;

    public constructor(destino: Vertice, peso: number) {
        this.peso = peso;
        this.destino = destino;
    }
}

class Vertice {
    public idVertice: number;
    public nome: string;
    public arcos: Arco[];

    public constructor(idVertice: number, nome: String) {
        this.idVertice = idVertice;
        this.nome = nome.toString();
        this.arcos = new Array();
    }
}

class Grafo {
    public vertices: Vertice[];
    public arcos: Arco[];
    public ponderado: boolean;
    public dirigido: boolean;

    public constructor() {
        this.vertices = new Array();
        this.arcos = new Array();
        this.ponderado = false;
        this.dirigido = false;
    }

    public getPorId(id: number): Vertice {
        return this.vertices.find(function(value, index, obj) {
            if (value.idVertice === id) {
                return true;
            }
            return false;
        });
    }

    public static ImportaGrafo(caminho: string): Grafo {
        let arquivo = fs.readFileSync(caminho);
        let grafo: Grafo = null;
        let ok: boolean = false;
        xml2js.parseString(arquivo.toString(), function(err, dados) {
            if (err != null) {
                console.error("Erro na leitura do XML: " + err);
            }
            grafo = new Grafo();
            let grafoXml = dados.Grafo;
            // Grava as propriedades do grafo
            grafo.ponderado = (grafoXml.$.ponderado === "true");
            grafo.dirigido = (grafoXml.$.dirigido === "true");
            // Grava os vértices do grafo
            grafoXml.Vertices[0].Vertice.forEach(function(v) {
                let idVertice = v.$.relId;
                let rotulo = v.$.rotulo;
                let vertice = new Vertice(idVertice, rotulo);
                grafo.vertices.push(vertice);
            });
            // Grava as arestas do grafo
            grafoXml.Arestas[0].Aresta.forEach(function(a) {
                let origem = a.$.idVertice1;
                let destino = a.$.idVertice2;
                let peso = a.$.peso;
                let arco = new Arco(grafo.getPorId(destino), peso);
                grafo.getPorId(origem).arcos.push(arco);
                grafo.arcos.push(arco);
                // Cria um arco simétrico se o grafo não for direcionado
                if (grafo.dirigido === false) {
                    let arco2 = new Arco(grafo.getPorId(origem), peso);
                    grafo.getPorId(destino).arcos.push(arco2);
                    grafo.arcos.push(arco2);
                    console.log("Simétrico: " + arco2);
                }
            });
            // Ordena os vértices alfabeticamente
            grafo.vertices.sort(function(a, b) {
                return a.nome.localeCompare(b.nome);
            });
            ok = true;
        });
        while (!ok) {
            console.log("Esperando leitura do grafo terminar...");
        }
        return grafo;
    }
}

electron.app.on("ready", function() {
    console.log("Importando XML...");
    let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
    if (arquivo != null) {
        let grafo = Grafo.ImportaGrafo(arquivo[0]);
        console.log(util.inspect(grafo, false, 4, true));
    }
    electron.app.exit(0);
});
