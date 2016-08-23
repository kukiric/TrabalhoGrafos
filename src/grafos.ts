import xml2js = require("xml2js");
import fs = require("fs");

////////////////
// Estruturas //
////////////////

export class Arco {
    public peso: number;
    public destino: Vertice;

    public constructor(destino: Vertice, peso: number) {
        this.peso = peso;
        this.destino = destino;
    }
}

export class Vertice {
    public id: number;
    public nome: string;
    public arcos: Arco[];
    public posicao: {x: Number, y: Number};

    public constructor(id: number, nome: String, posicao?: {x: Number, y: Number}) {
        this.id = id;
        this.nome = nome.toString();
        this.arcos = new Array();
        this.posicao = posicao || {x: 0, y: 0};
    }

    // Retorna os vértices adjacentes em ordem alfabética
    public get adjacentes(): Vertice[] {
        return this.arcos.map(adj => adj.destino).sort((a, b) => a.compare(b));
    }

    // Compara igualdade
    public equals(v2: Vertice) {
        return this.id === v2.id;
    }

    // Compara precedência
    public compare(v2: Vertice) {
        // Retorna o nome mais curto primeiro
        let diff = (this.nome.length - v2.nome.length);
        if (diff !== 0) {
            return diff;
        }
        // Se os nomes tiverem tamanho igual, realiza comparação alfabética
        else {
            return this.nome.localeCompare(v2.nome);
        }
    }
}

export class Grafo {
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

    public getVerticePorNome(nome: string): Vertice {
        return this.vertices.find(function(vertice) {
            return vertice.nome === nome;
        });
    }

    public contemTodos(subConjunto: Vertice[]): boolean {
        // Verifica se todos os vértices do grafo estão no sub-conjunto
        return this.vertices.every(v1 => subConjunto.find(v2 => v1.equals(v2)) != null);
    };

    public isConexo(): boolean {
        // Verifica se todos os vértices conseguem navegar por todo o grafo
        let visitados = new Array<Vertice>();
        return this.vertices.every((inicial: Vertice) => {
            // Pula o teste se o vértice inicial a ser testado já foi visitado
            if (visitados.find((v2: Vertice) => inicial.equals(v2))) {
                return true;
            }
            // Se não, testa se ele é conexo desse vértice
            return this.contemTodos(buscaDFS(inicial, visitados));
        });
    }
}

/////////////////////////
// Algorítmos de busca //
/////////////////////////

export function buscaDFS(inicial: Vertice, visitados?: Vertice[]): Vertice[] {
    if (visitados === undefined) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    // Entra no primeiro adjacente ainda não visitado recursivamente
    inicial.adjacentes.forEach(adjacente => {
        if (visitados.find(visistado => visistado.equals(adjacente)) == null) {
            visitados.push(adjacente);
            buscaDFS(adjacente, visitados);
        }
    });
    return visitados;
}

export function buscaBFS(inicial: Vertice, visitados?: Vertice[]): Vertice[] {
    if (visitados === undefined) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    // Entra em todos os adjacentes não visitados primeiro
    let novasVisitas = Array<Vertice>();
    inicial.adjacentes.forEach(adjacente => {
        if (visitados.find(visistado => visistado.equals(adjacente)) == null) {
            visitados.push(adjacente);
            novasVisitas.push(adjacente);
        }
    });
    novasVisitas.forEach(adjacente => {
        this.buscaBFS(adjacente, visitados);
    });
    return visitados;
}

/////////////////////////
// Métodos utilitários //
/////////////////////////

export function importarXML(caminho: string): Grafo {
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
            let posicao = {x: parseInt(v.$.posX), y: parseInt(v.$.posY)};
            let vertice = new Vertice(idVertice, rotulo, posicao);
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
        // Ordena os vértices
        grafo.vertices.sort((a, b) => a.compare(b));
    });
    return grafo;
}
