import * as xml from "xml2js";

///////////////////////////
// Estruturas de cálculo //
///////////////////////////

export class Ponto {
    public constructor(public x: number, public y: number) {}
    public toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}

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
    public posTela: Ponto;
    public posReal: Ponto;

    public constructor(id: number, nome: String, posTela?: Ponto, posReal?: Ponto) {
        this.id = id;
        this.nome = nome.toString();
        this.arcos = new Array();
        this.posTela = posTela || new Ponto(0, 0);
        this.posReal = posReal || new Ponto(0, 0);
    }

    // Retorna os vértices adjacentes em ordem alfabética
    public get adjacentes(): Vertice[] {
        return this.arcos.map(adj => adj.destino).sort((a, b) => a.compare(b));
    }

    // Retorna os vértices adjacentes e seus pesos
    public get adjacentesComPesos(): {v: Vertice, p: number}[] {
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
    public inicial: Vertice;
    public final: Vertice;

    public constructor() {
        this.vertices = new Array();
        this.arcos = new Array();
        this.inicial = null;
        this.final = null;
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
        this.x = vertice.posTela.x;
        this.y = vertice.posTela.y;
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

export type FuncaoBusca = (inicial: Vertice, procurado?: Vertice, Visitados?: Vertice[]) => ResultadoBusca;

export class ResultadoBusca {
    constructor (
        public inicial: Vertice,
        public procurado: Vertice,
        public visitados: Vertice[],
        public caminho: Vertice[],
        public encontrado: boolean,
        public distancias: number[],
        public nome: string
    ) {}
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
    let distancias = visitados.map(v => -1);
    return new ResultadoBusca(inicial, procurado || null, visitados, caminho, encontrado, distancias, "DFS");
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
    let caminho: Vertice[];
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
    let distancias = visitados.map(v => -1);
    return new ResultadoBusca(inicial, procurado || null, visitados, caminho || [], encontrado, distancias, "BFS");
}

// Estrutura privadas do Dijkstra
class CorrenteDijkstra {
    constructor(public vertice: Vertice, public distancia: number, public antecedente: CorrenteDijkstra) {}

    public caminhoAteRaiz(): Vertice[] {
        let cadeia: CorrenteDijkstra = this;
        let caminho = new Array<Vertice>();
        caminho.unshift(cadeia.vertice);
        while (cadeia.antecedente != null) {
            cadeia = cadeia.antecedente;
            caminho.unshift(cadeia.vertice);
        }
        return caminho;
    }
}

export function buscaDijkstra(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[]): ResultadoBusca {
    if (visitados == null) {
        visitados = new Array<Vertice>();
        visitados.push(inicial);
    }
    // Retorna imediatamente se o vértice final for o mesmo que o inicial
    if (inicial.equals(procurado)) {
        return new ResultadoBusca(inicial, procurado, visitados, visitados, true, [0], "Dijkstra");
    }
    let raiz = new CorrenteDijkstra(inicial, 0, null);
    let tabela = new Array<CorrenteDijkstra>();
    let fila = new Array<CorrenteDijkstra>();
    tabela.push(raiz);
    fila.push(raiz);
    while (fila.length > 0) {
        let atual = fila[0];
        atual.vertice.adjacentesComPesos.forEach(adjacente => {
            // Adiciona vértices novos nos visitados
            if (!visitados.find(outro => outro.equals(adjacente.v))) {
                visitados.push(adjacente.v);
            }
            // Calcula a distância total até esse vértice
            let distancia = atual.distancia + adjacente.p;
            // Procura o próximo laço adjacente na tabela
            let proxLaço = tabela.find(elemento => elemento.vertice.equals(adjacente.v));
            // Cria um novo elemento na tabela se ele não foi visitado ainda
            if (proxLaço == null) {
                proxLaço = new CorrenteDijkstra(adjacente.v, distancia, raiz);
                tabela.push(proxLaço);
            }
            // Verifica se esse pode ser o menor caminho até o vértice
            if (distancia <= proxLaço.distancia) {
                proxLaço.distancia = distancia;
                proxLaço.antecedente = atual;
                fila.push(proxLaço);
            }
        });
        // E depois remove o primeiro vértice da fila
        fila.shift();
    }
    let verticeFinal = tabela.find(elemento => elemento.vertice.equals(procurado));
    let encontrado = verticeFinal != null;
    let caminho = encontrado ? verticeFinal.caminhoAteRaiz() : [];
    let distancias = tabela.map(v => v.distancia);
    return new ResultadoBusca(inicial, procurado, visitados, caminho, encontrado, distancias, "Dijkstra");
}

/////////////////////////
// Métodos utilitários //
/////////////////////////

function importarXMLGraphMax(grafoXml: any): Grafo {
    let grafo = new Grafo();
    // Grava as propriedades do grafo
    grafo.ponderado = (grafoXml.$.ponderado === "true");
    grafo.dirigido = (grafoXml.$.dirigido === "true");
    // Grava os vértices do grafo
    grafoXml.Vertices[0].Vertice.forEach(function(v: any) {
        let idVertice = parseInt(v.$.relId, 10);
        let rotulo = v.$.rotulo;
        let posicao = new Ponto(parseInt(v.$.posX, 10), parseInt(v.$.posY, 10));
        let vertice = new Vertice(idVertice, rotulo, posicao);
        grafo.vertices.push(vertice);
    });
    // Grava as arestas do grafo
    grafoXml.Arestas[0].Aresta.forEach(function(a: any) {
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
    // E retorna o grafo construído
    return grafo;
}

// TODO: tornar a heurística ajustável
function heuristicaDistancia(p1: Ponto, p2: Ponto): number {
    return Math.sqrt(p1.x ** 2 + p2.y ** 2);
}

function importarXMLMatriz(mapa: any): Grafo {

    function getPosicao(pos: string): Ponto {
        let strSplit = pos.split(",", 2).map(x => x.trim());
        let x = parseInt(strSplit[0], 10);
        let y = parseInt(strSplit[1], 10);
        return new Ponto(x, y);
    }

    function getNome(linha: number, coluna: number): string {
        return `${linha + 1},${coluna + 1}`;
    }

    function posTela(linha: number, coluna: number): Ponto {
        return new Ponto(coluna * 64, linha * 64);
    }

    function posReal(linha: number, coluna: number): Ponto {
        return new Ponto(coluna * 10, linha * 10);
    }

    function indiceMatriz(linha: number, coluna: number): number {
        return coluna + (linha * colunas);
    }

    function getVertice(linha: number, coluna: number): Vertice | undefined {
        if (linha >= 0 && linha < linhas && coluna >= 0 && coluna < colunas) {
            return vertices[indiceMatriz(linha, coluna)];
        }
        return undefined;
    }

    function getVizinhos(linha: number, coluna: number): Vertice[] {
        let vizinhos = new Array<Vertice>();
        vizinhos.push(getVertice(linha - 1, coluna - 1));
        vizinhos.push(getVertice(linha - 1, coluna    ));
        vizinhos.push(getVertice(linha - 1, coluna + 1));
        vizinhos.push(getVertice(linha    , coluna - 1));
        vizinhos.push(getVertice(linha    , coluna + 1));
        vizinhos.push(getVertice(linha + 1, coluna - 1));
        vizinhos.push(getVertice(linha + 1, coluna    ));
        vizinhos.push(getVertice(linha + 1, coluna + 1));
        return vizinhos.filter(v => v !== undefined);
    }

    // Extrai os dados do XML
    let linhas = mapa.LINHAS;
    let colunas = mapa.COLUNAS;
    let inicio = getPosicao(mapa.INICIAL[0]);
    let fim = getPosicao(mapa.FINAL[0]);
    let barreiras: Ponto[] = mapa.BARREIRAS[0].MURO.map((x: any) => getPosicao(x));

    // Prepara a estrutura de importação
    let vertices = new Array<Vertice>(linhas * colunas);
    let arcos = new Array<Arco>();
    let id = 0;

    // Preenche a matriz
    for (let i = 0; i < linhas; i++) {
        for (let j = 0; j < colunas; j++) {
            // Cria o vértice se não houver barreira nessa posição
            if (!barreiras.find(p => p.x === i + 1 && p.y === j + 1)) {
                let vertice = new Vertice(id++, getNome(i, j), posTela(i, j), posReal(i, j));
                vertices[indiceMatriz(i, j)] = vertice;
            }
            else {
                vertices[indiceMatriz(i, j)] = undefined;
            }
        }
    }

    // Conecta os vizinhos
    for (let i = 0; i < linhas; i++) {
        for (let j = 0; j < colunas; j++) {
            let vertice = getVertice(i, j);
            if (vertice !== undefined) {
                let vizinhos = getVizinhos(i, j);
                vizinhos.forEach(vizinho => {
                    let arco = new Arco(vizinho, 1);
                    vertice.arcos.push(arco);
                    arcos.push(arco);
                });
            }
        }
    }

    // Constroi e retorna o grafo
    let grafo = new Grafo();
    grafo.dirigido = false;
    grafo.ponderado = false;
    grafo.inicial = getVertice(inicio.x - 1, inicio.y - 1);
    grafo.final = getVertice(fim.x - 1, fim.y - 1);
    grafo.vertices = vertices.filter(v => v !== undefined);
    grafo.arcos = arcos;
    return grafo;
}

export function importarXML(arquivo: File, retorno: (grafo: Grafo) => void): void {
    let grafo: Grafo = null;
    let leitor = new FileReader();
    leitor.onload = function(event: Event) {
        xml.parseString(leitor.result, function(erro, dados) {
            if (erro != null) {
                console.error(erro);
                alert("O arquivo selecionado não é um XML válido!");
            }
            else {
                // Formato do GraphMax abre com a tag "Grafo"
                if (dados.Grafo) {
                    grafo = importarXMLGraphMax(dados.Grafo);
                }
                // Enquanto a matriz do A* abre com "MAPA"
                else if (dados.MAPA) {
                    grafo = importarXMLMatriz(dados.MAPA);
                }
                // Se não, é um formato inválido
                else {
                    alert("Formato do grafo não reconhecido!");
                }
            }
        });
        retorno(grafo);
    };
    leitor.readAsText(arquivo, "UTF-8");
}
