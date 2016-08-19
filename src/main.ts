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
    public id: number;
    public nome: string;
    public arcos: Arco[];

    public constructor(id: number, nome: String) {
        this.id = id;
        this.nome = nome.toString();
        this.arcos = new Array();
    }

    public get adjacentes(): Vertice[] {
        return this.arcos.map(adj => adj.destino);
    }

    public equals(v2: Vertice) {
        return this.id === v2.id;
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

    public getVerticePorID(id: number): Vertice {
        return this.vertices.find(function(vertice) {
            return vertice.id === id;
        });
    }

    public getVerticePorNome(nome: string) : Vertice {
        return this.vertices.find(function(vertice) {
            return vertice.nome === nome;
        });
    }

    public static DFS(inicial: Vertice, visitados?: Vertice[]): Vertice[] {
        if (visitados === undefined) {
            visitados = new Array<Vertice>();
            visitados.push(inicial);
        }
        let resultado = new Array<Vertice>();
        // Visita cada adjacente ainda não visitado
        inicial.adjacentes.forEach(adjacente => {
            if (visitados.find(visistado => visistado.equals(adjacente)) == null) {
                visitados.push(adjacente);
                console.log("Novo adjacente de " + inicial.nome + ": " + adjacente.nome);
                this.DFS(adjacente, visitados);
            }
        });
        return resultado;
    }

    public contemTodos(vertices: Vertice[]): boolean {
        if (vertices.length === 0) {
            return false;
        }
        let conexo = true;
        // Verifica se todos os vértices do grafo estão no parâmetro
        this.vertices.forEach((vertice: Vertice) => {
            if (this.getVerticePorNome(vertice.nome) == null) {
                conexo = false;
            }
        });
        return conexo;
    };

    public static ImportaGrafo(caminho: string): Grafo {
        let arquivo = fs.readFileSync(caminho);
        let grafo: Grafo = null;
        xml2js.parseString(arquivo.toString(), function(erro, dados) {
            if (erro != null) {
                console.error(erro);
            }
            grafo = new Grafo();
            let grafoXml = dados.Grafo;
            // Grava as propriedades do grafo
            grafo.ponderado = (grafoXml.$.ponderado === "true");
            grafo.dirigido = (grafoXml.$.dirigido === "true");
            // Grava os vértices do grafo
            grafoXml.Vertices[0].Vertice.forEach(function(v) {
                let idVertice = parseInt(v.$.relId);
                let rotulo = v.$.rotulo;
                let vertice = new Vertice(idVertice, rotulo);
                grafo.vertices.push(vertice);
            });
            // Grava as arestas do grafo
            grafoXml.Arestas[0].Aresta.forEach(function(a) {
                let origem = parseInt(a.$.idVertice1);
                let destino = parseInt(a.$.idVertice2);
                let peso = parseFloat(a.$.peso);
                let arco = new Arco(grafo.getVerticePorID(destino), peso);
                grafo.getVerticePorID(origem).arcos.push(arco);
                grafo.arcos.push(arco);
                // Cria um arco simétrico se o grafo não for direcionado
                if (grafo.dirigido === false) {
                    let arco2 = new Arco(grafo.getVerticePorID(origem), peso);
                    grafo.getVerticePorID(destino).arcos.push(arco2);
                    grafo.arcos.push(arco2);
                }
            });
            // Ordena os vértices alfabeticamente
            grafo.vertices.sort(function(a, b) {
                // Retorna o mais curto primeiro
                let diff = (a.nome.length - b.nome.length);
                // Se o tamanho for igual, realiza comparação léxica
                if (diff === 0) {
                    return a.nome.localeCompare(b.nome);
                }
                return diff;
            });
        });
        return grafo;
    }
}

// Função principal da aplicação
electron.app.on("ready", function() {
    try {
        let arquivo = electron.dialog.showOpenDialog({properties: ["openFile"]});
        if (arquivo != null) {
            console.log("Importando XML...");
            let grafo = Grafo.ImportaGrafo(arquivo[0]);
            let vertices: Vertice[];
            console.log(util.inspect(grafo, false, 4, true));
            // Busca de profundidade
            console.log("");
            console.log("DFS a partir de A: ");
            vertices = Grafo.DFS(grafo.getVerticePorNome("A"));
            console.log(util.inspect(vertices, false, 1, true));
            console.log("Conexo: " + grafo.contemTodos(vertices));
        }
    }
    catch(erro) {
        console.error(erro);
        electron.app.exit(1);
    }
    electron.app.exit(0);
});
