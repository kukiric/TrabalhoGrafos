import electron = require("electron");
import xml2js = require("xml2js");
import util = require("util");
import fs = require("fs");

class Arco {
    public peso: Number;
    public destino: Vertice;

    public constructor(destino: Vertice, peso: Number) {
        this.peso = peso;
        this.destino = destino;
    }
}

class Vertice {
    public idVertice: Number;
    public nome: String;
    public arcos: Arco[];

    public constructor(idVertice: Number, nome: String) {
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

    public getPorId(id: Number): Vertice {
        return this.vertices.find(function(value, index, obj) {
            if(value.idVertice === id) {
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
            // Grava as propriedades do grafo
            grafo.ponderado = dados.Grafo.$.ponderado;
            grafo.dirigido = dados.Grafo.$.dirigido;
            if(!grafo.dirigido) {
                console.error("Grafo não dirigido não suportado nesse trabalho!");
                return null;
            }
            // Grava os vértices do grafo
            dados.Grafo.Vertices[0].Vertice.forEach(function(v) {
                let idVertice = v.$.relId;
                let rotulo = v.$.rotulo;
                let vertice = new Vertice(idVertice, rotulo);
                grafo.vertices.push(vertice);
            });
            // Grava as arestas do grafo
            dados.Grafo.Arestas[0].Aresta.forEach(function(a) {
                let origem = a.$.idVertice1;
                let destino = a.$.idVertice2;
                let peso = a.$.peso;
                let arco = new Arco(grafo.getPorId(destino), peso);
                grafo.getPorId(origem).arcos.push(arco);
                grafo.arcos.push(arco);
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
    if(arquivo != null) {
        let grafo = Grafo.ImportaGrafo(arquivo[0]);
        console.log(grafo);
    }
    electron.app.exit(0);
});
