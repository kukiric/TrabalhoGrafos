import xml2js = require("xml2js");
import fs = require("fs");

///////////////////////////
// Estruturas de cálculo //
///////////////////////////

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
    public posicao: {x: number, y: number};

    public constructor(id: number, nome: String, posicao?: {x: number, y: number}) {
        this.id = id;
        this.nome = nome.toString();
        this.arcos = new Array();
        this.posicao = posicao || {x: 0, y: 0};
    }

    // Retorna os vértices adjacentes em ordem alfabética
    public get adjacentes(): Vertice[] {
        return this.arcos.map(adj => adj.destino).sort((a, b) => a.compare(b));
    }

    // Retorna os vértices adjacentes e seus pesos
    public get pesoAdjacentes(): {v: Vertice, p: number}[] {
        return this.arcos.map(adj => ({v: adj.destino, p: adj.peso})).sort((a, b) => a.v.compare(b.v));
    }

    // Compara igualdade
    public equals(v2: Vertice) {
        return this != null && v2 != null && this.id === v2.id;
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
        // Verifica se todos os vértices têm ligação com todos os outros do grafo
        return this.vertices.every((inicial: Vertice) => {
            return this.contemTodos(buscaDFS(inicial, null).visitados);
        });
    }

    public getMatrizAdjacencia(): number[][] {
        // Gera a matriz vazia
        const tamanho = this.vertices.length;
        let matriz = new Array<number[]>(tamanho);
        // Calcula os valores da matriz
        this.vertices.forEach((v1, i) => {
            matriz[i] = new Array<number>(tamanho);
            this.vertices.forEach((v2, j) => {
                // Marca a célula como tendo custo infinito por padrão
                matriz[i][j] = -1.0;
                // Insere o custo na matriz de adjacência se houver ligação entre os dois vértices
                v1.arcos.every(arco => {
                    if (arco.destino.equals(v2)) {
                        matriz[i][j] = arco.peso;
                        return false; // break
                    }
                    return true; // continue
                });
            });
        });
        return matriz;
    }
}

/////////////////////////////////
// Estruturas de armazenamento //
/////////////////////////////////

export class ArcoAciclico {
    idDestino: number;
    peso: number;

    constructor(arco: Arco) {
        this.idDestino = arco.destino.id;
        this.peso = arco.peso;
    }
}

export class VerticeAciclico {
    nome: string;
    id: number;
    x: number;
    y: number;
    arcos: ArcoAciclico[];

    constructor(vertice: Vertice) {
        this.nome = vertice.nome;
        this.id = vertice.id;
        this.x = vertice.posicao.x;
        this.y = vertice.posicao.y;
        this.arcos = vertice.arcos.map(arco => {
            return new ArcoAciclico(arco);
        });
    }
}

export class GrafoAciclico {
    public vertices: VerticeAciclico[];
    public ponderado: boolean;
    public dirigido: boolean;

    constructor(grafo: Grafo) {
        this.vertices = grafo.vertices.map(vertice => new VerticeAciclico(vertice));
        this.ponderado = grafo.ponderado;
        this.dirigido = grafo.dirigido;
    }

    public toGrafo(): Grafo {
        let grafo = new Grafo();
        // Copia as propriedades
        grafo.ponderado = this.ponderado;
        grafo.dirigido = this.dirigido;
        // Re-cria os vértices
        this.vertices.forEach(vertice => {
            let verticeReal = new Vertice(vertice.id, vertice.nome, {x: vertice.x, y: vertice.y});
            grafo.vertices.push(verticeReal);
        });
        // Re-cria os arcos
        this.vertices.forEach(vertice => {
            vertice.arcos.forEach(arco => {
                let v1 = grafo.getVerticePorID(vertice.id);
                let v2 = grafo.getVerticePorID(arco.idDestino);
                let arcoReal = new Arco(v2, arco.peso);
                grafo.arcos.push(arcoReal);
                v1.arcos.push(arcoReal);
            });
        });
        return grafo;
    }
}

/////////////////////////
// Algorítmos de busca //
/////////////////////////

export class ResultadoBusca {
    inicial: Vertice;
    procurado: Vertice;
    visitados: Vertice[];
    caminho: Vertice[];
    encontrado: boolean;

    constructor(inicial: Vertice, procurado: Vertice, visitados: Vertice[], caminho: Vertice[], encontrado: boolean) {
        this.inicial = inicial;
        this.procurado = procurado;
        this.visitados = visitados;
        this.caminho = caminho;
        this.encontrado = encontrado;
    }
}

export function buscaDFS(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[], caminho?: Vertice[]): ResultadoBusca {
    if (visitados == null) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    if (caminho == null) {
        caminho = new Array<Vertice>();
    }
    // Pára se esse for o vértice procurado
    let encontrado = inicial.equals(procurado);
    if (!encontrado) {
        encontrado = inicial.adjacentes.some(adjacente => {
            // Busca todos os adjacentes ainda não visitados
            if (visitados.find(visistado => visistado.equals(adjacente)) == null) {
                visitados.push(adjacente);
                if (buscaDFS(adjacente, procurado, visitados, caminho).encontrado) {
                    return true;
                }
            }
            return false;
        });
    }
    // Adiciona o elemento no caminho se encontrado
    if (encontrado) {
        caminho.unshift(inicial);
    }
    // Retorna os resultados da busca
    return new ResultadoBusca(inicial, procurado || null, visitados, caminho, encontrado);
}

// Estrutura privada do BFS
// Usada para encontrar o caminho final
class CadeiaBFS {
    constructor(public pai: CadeiaBFS, public vertice: Vertice) {}

    public caminhoAteRaiz(ultimo: Vertice): Vertice[] {
        let no: CadeiaBFS = this;
        let caminho = new Array<Vertice>();
        while (no.pai != null) {
            caminho.unshift(no.vertice);
            no = no.pai;
        }
        caminho.unshift(no.vertice);
        caminho.push(ultimo);
        return caminho;
    }
}

export function buscaBFS(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[], fila?: CadeiaBFS[], cadeia?: CadeiaBFS): ResultadoBusca {
    if (visitados == null) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    if (cadeia == null) {
        cadeia = new CadeiaBFS(null, inicial);
    }
    if (fila == null) {
        fila = new Array<CadeiaBFS>();
        fila.push(cadeia);
    }
    let caminho;
    let encontrado = inicial.equals(procurado);
    if (!encontrado) {
        encontrado = inicial.adjacentes.some(adjacente => {
            // Adiciona todos os vértices adjacentes ainda não visitados na fila
            if (visitados.find(visistado => visistado.equals(adjacente)) == null) {
                visitados.push(adjacente);
                // Pára se encontrar o elemento na lista de adjacentes
                if (adjacente.equals(procurado)) {
                    caminho = cadeia.caminhoAteRaiz(adjacente);
                    return true;
                }
                else {
                    fila.push(new CadeiaBFS(cadeia, adjacente));
                }
            }
            return false;
        });
    }
    if (!encontrado) {
        // Remove esse elemento e segue para o próximo da fila
        fila.shift();
        if (fila.length > 0) {
            let resultado = buscaBFS(fila[0].vertice, procurado, visitados, fila, fila[0]);
            // Salva os valores das iterações seguintes
            encontrado = resultado.encontrado;
            caminho = resultado.caminho;
        }
    }
    // E retorna o resultado
    return new ResultadoBusca(inicial, procurado || null, visitados, caminho || [], encontrado);
}

class CorrenteDijkstra {
    constructor(public vertice: Vertice, public distancia: number, public antecedente: CorrenteDijkstra) {}

    public caminhoAteRaiz(): Vertice[] {
        let cadeia: CorrenteDijkstra = this;
        let caminho = new Array<Vertice>();
        while (cadeia.antecedente != null) {
            cadeia = cadeia.antecedente;
            caminho.unshift(cadeia.vertice);
        }
        return caminho;
    }
}

export function buscaDijkstra(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[], tabela?: CorrenteDijkstra[], laço?: CorrenteDijkstra) : ResultadoBusca {
    if (visitados == null) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    if (laço == null) {
        laço = new CorrenteDijkstra(inicial, 0, null);
    }
    if (tabela == null) {
        tabela = new Array<CorrenteDijkstra>();
        tabela.push(laço);
    }
    inicial.pesoAdjacentes.forEach(adjacente => {
        // Não repete os visitados
        if (!visitados.find(outro => outro.equals(adjacente.v))) {
            visitados.push(adjacente.v);
            let distancia = laço.distancia + adjacente.p;
            let proxLaço = tabela.find(elemento => elemento.vertice.equals(adjacente.v));
            // Cria um novo elemento na tabela
            if (proxLaço == null) {
                proxLaço = new CorrenteDijkstra(adjacente.v, distancia, laço);
                tabela.push(proxLaço);
            }
            // Verifica se esse pode ser o menor caminho até o vértice
            if (distancia <= proxLaço.distancia) {
                proxLaço.distancia = distancia;
                proxLaço.antecedente = laço;
                let proxTabela = tabela.slice(0);
                let resultado = buscaDijkstra(adjacente.v, procurado, visitados, proxTabela, proxLaço);
                if (resultado.encontrado) {
                    tabela = proxTabela;
                }
            }
        }
    });
    let encontrado = tabela.find(elemento => elemento.vertice.equals(procurado)) != null;
    let caminho = encontrado ? laço.caminhoAteRaiz() : [];
    return new ResultadoBusca(inicial, procurado, visitados, caminho, encontrado);
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
