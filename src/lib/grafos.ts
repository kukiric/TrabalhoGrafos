import * as xml from "xml2js";

///////////////////////////
// Estruturas de cálculo //
///////////////////////////

export class Ponto {
    public constructor(
        public x: number,
        public y: number
    ) {}

    public static zero = new Ponto(0, 0);

    public toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}

export class Arco {
    public constructor(
        public origem: Vertice,
        public destino: Vertice,
        public peso: number = 1
    ) {}
}

export class Vertice {
    public id: number;
    public nome: string;
    public arcos: Arco[];
    public arcosInversos: Arco[];
    public posTela: Ponto;
    public posReal: Ponto;
    public grafo: Grafo;

    public constructor(id: number, nome: String, posTela: Ponto = Ponto.zero, posReal: Ponto = posTela, grafo: Grafo) {
        this.id = id;
        this.nome = nome.toString();
        this.arcos = new Array();
        this.arcosInversos = new Array();
        this.posTela = posTela;
        this.posReal = posReal;
        this.grafo = grafo;
    }

    // Retorna os vértices diretamente adjacentes em ordem alfabética
    public get adjacentes(): Vertice[] {
        return this.arcos.map(adj => adj.destino).sort((a, b) => a.compare(b));
    }

    // Retorna os vértices diretamente adjacentes e seus pesos
    public get adjacentesComPesos(): {v: Vertice, p: number}[] {
        return this.arcos.map(adj => ({v: adj.destino, p: adj.peso})).sort((a, b) => a.v.compare(b.v));
    }

    // Retorna todos os vértices adjacentes diretos e inversos
    public get todosLigados(): Vertice[] {
        return this.arcos.map(adj => adj.destino)
            .concat(this.arcosInversos.map(adj => adj.origem))
            .sort((a, b) => a.compare(b));
    }

    // Retorna a soma do número de arcos diretos e arcos inversos
    public get numTotalLigacoes(): number {
        return this.arcos.length + this.arcosInversos.length;
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

export const enum Conectividade {
    NaoConexo,
    FracamenteConexo,
    FortementeConexo
}

export class Grafo {
    public vertices: Vertice[];
    public arcos: Arco[];
    public ponderado: boolean;
    public dirigido: boolean;
    public mapa: boolean;
    public inicial: Vertice;
    public final: Vertice;
    public arcosAdicionais: Arco[];

    public constructor() {
        this.vertices = new Array();
        this.arcos = new Array();
        this.ponderado = false;
        this.dirigido = false;
        this.mapa = false;
        this.inicial = null;
        this.final = null;
        this.arcosAdicionais = new Array();
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

    public getNumArestas(): number {
        if (this.dirigido) {
            return this.arcos.length;
        }
        else {
            return this.arcos.length / 2;
        }
    }

    public isConexo(): boolean {
        return this.vertices.every(vertice => {
            let busca = buscaDFS(vertice).next().value;
            return this.vertices.every(outro => {
                return busca.visitados.find(cada => cada.equals(outro)) != null;
            });
        });
    }

    public geraColoracao(): Map<Vertice, number> {
        let resultado = new Map<Vertice, number>();
        // Ordena os vértices por grauw
        let verticesGrau = this.vertices.slice().sort((a, b) => a.numTotalLigacoes - b.numTotalLigacoes);
        // Calcula a cor de cada vértice do grafo
        for (let vertice of this.vertices) {
            let coresVizinhas = new Set<number>();
            for (let vizinho of vertice.todosLigados) {
                // Verifica se o vizinho já foi colorido
                if (resultado.has(vizinho)) {
                    coresVizinhas.add(resultado.get(vizinho));
                }
            }
            // Busca a menor cor vizinha que não foi usada ainda
            let cor = 0;
            while (coresVizinhas.has(cor)) {
                cor++;
            }
            // E salva no resultado
            resultado.set(vertice, cor);
        }
        return resultado;
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
            let verticeReal = new Vertice(vertice.id, vertice.nome, {x: vertice.x, y: vertice.y}, {x: vertice.x, y: vertice.y}, grafo);
            grafo.vertices.push(verticeReal);
        });
        // Re-cria os arcos
        this.vertices.forEach(vertice => {
            vertice.arcos.forEach(arco => {
                let v1 = grafo.getVerticePorID(vertice.id);
                let v2 = grafo.getVerticePorID(arco.idDestino);
                let arcoReal = new Arco(v1, v2, arco.peso);
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

export type FuncaoBusca = (inicial: Vertice, procurado?: Vertice, Visitados?: Vertice[]) => Iterator<ResultadoBusca>;

export class ResultadoBusca {
    constructor (
        public inicial: Vertice,
        public procurado: Vertice,
        public visitados: Vertice[],
        public caminho: Vertice[],
        public encontrado: boolean,
        public distancias: number[],
        public nome: string,
        public abertos?: Vertice[],
        public atuais?: Vertice[],
        public checado?: Vertice,
        public detalhes?: any
    ) {}
}

export function *buscaDFS(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[], caminho?: Vertice[]): Iterator<ResultadoBusca> {
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
                if (buscaDFS(adjacente, procurado, visitados, caminho).next().value.encontrado) {
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

export function *buscaBFS(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[], fila?: CadeiaBFS[], cadeia?: CadeiaBFS): Iterator<ResultadoBusca> {
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
            let resultado = buscaBFS(fila[0].vertice, procurado, visitados, fila, fila[0]).next().value;
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

export function *buscaDijkstra(inicial: Vertice, procurado?: Vertice, visitados?: Vertice[]): Iterator<ResultadoBusca> {
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

export function *buscaAStar(inicial: Vertice, procurado: Vertice): Iterator<ResultadoBusca> {
    let it = 0;
    // Teorema de pitágoras (distância planar real)
    function heuristicaDistancia(v1: Vertice, v2: Vertice): number {
        let x = Math.abs(v2.posReal.x - v1.posReal.x);
        let y = Math.abs(v2.posReal.y - v1.posReal.y);
        return Math.sqrt(x ** 2 + y ** 2);
    }
    // Retorna o vértice com o menor distância heurística para um destino
    function getMaisProximo(vertices: Vertice[], destino: Vertice): Vertice {
        return vertices.reduce((anterior, atual) => {
            if (heuristicaDistancia(atual, destino) < heuristicaDistancia(anterior, destino)) {
                return atual;
            }
            else {
                return anterior;
            }
        });
    }
    // Constroi o caminho a partir da arvore
    function getCaminho(arvore: Map<Vertice, Vertice>, vertice: Vertice): Vertice[] {
        let caminho = new Array<Vertice>();
        caminho.unshift(vertice);
        while (arvoreCaminho.has(vertice)) {
            vertice = arvoreCaminho.get(vertice);
            caminho.unshift(vertice);
        }
        return caminho;
    }
    if (!procurado) {
        alert("Por favor, selecione um vértice de destino");
        return null;
    }
    let arvoreCaminho = new Map<Vertice, Vertice>();
    let fechados = new Set<Vertice>();
    let abertos = new Set<Vertice>();
    let distInicio = new Map<Vertice, number>();
    let distTotal = new Map<Vertice, number>();
    fechados.add(inicial);
    distInicio.set(inicial, 0);
    distTotal.set(inicial, 0 + heuristicaDistancia(inicial, procurado));
    abertos.add(inicial);
    while (abertos.size > 0) {
        // Encontra o nó aberto mais próximo do final
        let vertice = getMaisProximo(Array.from(abertos), procurado);
        // Move o vértice da lista aberta pra fechada
        abertos.delete(vertice);
        fechados.add(vertice);
        // Gera o caminho do passo atual
        let caminho = getCaminho(arvoreCaminho, vertice);
        let visitados = Array.from(fechados);
        let visitadosAbertos = Array.from(abertos);
        let distancias = visitados.map(v => -1);
        // Finaliza a busca se esse for o nó final
        if (vertice.equals(procurado)) {
            return new ResultadoBusca(inicial, procurado, visitados, caminho, true, distancias, "A*");
        }
        yield new ResultadoBusca(inicial, procurado, visitados, caminho, true, distancias, "A*", visitadosAbertos, [vertice]);
        for (let adjacente of vertice.adjacentes) {
            // Não re-visita o mesmo vértice
            if (fechados.has(adjacente)) {
                continue;
            }
            // Calcula os valores G e H do nó
            let g = distInicio.get(vertice) + heuristicaDistancia(vertice, adjacente);
            let h = heuristicaDistancia(adjacente, procurado);
            // Pinta o progresso atual na tela
            visitadosAbertos = Array.from(abertos);
            yield new ResultadoBusca(inicial, procurado, visitados, caminho, true, distancias, "A*", visitadosAbertos, [vertice], adjacente, {G: g, H: h, F: g + h});
            // Adiciona esse vértice como um caminho provável
            if (!abertos.has(adjacente)) {
                abertos.add(adjacente);
            }
            // Ignora esse caminho se ele for mais distante do início
            if (g > distInicio.get(adjacente)) {
                continue;
            }
            arvoreCaminho.set(adjacente, vertice);
            distInicio.set(adjacente, g);
            distTotal.set(adjacente, g + h);
        }
    }
    let visitados = Array.from(fechados);
    let visitadosAbertos = Array.from(abertos);
    let distancias = visitados.map(v => -1);
    return new ResultadoBusca(inicial, procurado, visitados, [], false, distancias, "A*", visitadosAbertos);
}

export function *buscaPCV(inicial: Vertice): Iterator<ResultadoBusca> {
    // Heurística: Inserção de Menor Encargo
    type ArcoCiclo = {v: Vertice, p: number};
    let grafo = inicial.grafo;
    // Não processa o grafo se ele não for conexo
    if (!grafo.isConexo()) {
        alert("Caxeiro Viajante impossível: o grafo não é conexo!");
        return null;
    }
    let cicloCompleto = new Array<ArcoCiclo>();
    let arestaInfinita: Arco = null;
    // Primeiro, encontra a menor aresta possível
    // Desta aresta, será construído o primeiro sub-ciclo de ida e volta
    let arestaInicial = grafo.arcos.reduce((prev, curr) => prev.peso < curr.peso ? prev : curr);
    // Distância de ida e volta
    let distTotal = arestaInicial.peso + arestaInicial.peso;
    let caminho = [arestaInicial.origem, arestaInicial.destino, arestaInicial.origem];
    let adicionados = new Set<Vertice>(caminho);
    yield new ResultadoBusca(inicial, null, [], caminho, true, [], "Caxeiro Viajante");
    while (true) {
        let verticeMenorDist: Vertice;
        let menorDist = Infinity;
        let indiceInsercao: number;
        let v1: Vertice, v2: Vertice;
        // Tenta a possível inserção de um novo vértice entre cada par único de vértices do ciclo
        for (let i = 0; i < caminho.length - 2; i++) {
            v1 = caminho[i + 0];
            v2 = caminho[i + 1];
            let adjacentes = v1.adjacentesComPesos.filter(adj => !adicionados.has(adj.v) && adj.v.adjacentes.find(outro => outro.equals(v2)));
            // Exibe o progresso na tela
            yield new ResultadoBusca(inicial, null, [], caminho, true, [], "Caxeiro Viajante", adjacentes.map(a => a.v), [v1, v2]);
            // Mede a distância de cada adjacente até o segundo vértice
            for (let adj of adjacentes) {
                // Encontra a distância até v2 desse vértice
                let arestaParaV2 = adj.v.adjacentesComPesos.find(outro => outro.v.equals(v2));
                if (arestaParaV2 != null) {
                    // Exibe o progresso na tela
                    yield new ResultadoBusca(inicial, null, [], caminho, true, [], "Caxeiro Viajante", adjacentes.map(a => a.v), [v1, v2], adj.v);
                    // Soma a distância do V1 para o novo vértice para o V2
                    let dist = adj.p + arestaParaV2.p;
                    if (dist < menorDist && !adicionados.has(adj.v)) {
                        menorDist = dist;
                        verticeMenorDist = adj.v;
                        indiceInsercao = i + 1;
                        grafo.arcosAdicionais = new Array();
                        arestaInfinita = null;
                    }
                }
            }
        }
        // Se não for encontrada mais nenhuma aresta menor que a atual
        if (verticeMenorDist === undefined) {
            // Termina se o grafo ciclo conter todos os vértices
            if (grafo.vertices.every(v => adicionados.has(v))) {
                break;
            }
            // Se não, cria uma aresta infinita temporária entre um vértice e o seu primeiro adjacente que não faz parte do ciclo
            let v1: Vertice, v2: Vertice;
            let adjacente: Vertice = null;
            for (let i = 0; i < caminho.length - 2; i++) {
                v1 = caminho[i + 0];
                v2 = caminho[i + 1];
                adjacente = v1.adjacentes.find(outro => !adicionados.has(outro));
                if (adjacente != null) {
                    break;
                }
            }
            // Nenhum vértice tem mais algum adjacente válido
            if (adjacente == null) {
                let visitados = caminho.filter((v, i, arr) => i === arr.indexOf(v));
                return new ResultadoBusca(inicial, null, visitados, [], false, [], "Caxeiro Viajante");
            }
            // Exibe o progresso na tela
            yield new ResultadoBusca(inicial, null, [], caminho, true, [], "Caxeiro Viajante", [], [v1, v2], adjacente);
            // Adiciona a aresta
            arestaInfinita = new Arco(v2, adjacente, -1);
            grafo.arcosAdicionais = [arestaInfinita];
            indiceInsercao = caminho.indexOf(v2);
            verticeMenorDist = adjacente;
        }
        caminho.splice(indiceInsercao, 0, verticeMenorDist);
        adicionados.add(verticeMenorDist);
        // Exibe o progresso na tela
        yield new ResultadoBusca(inicial, null, [], caminho, true, [], "Caxeiro Viajante");
    }
    let visitados = caminho.filter((v, i, arr) => i === arr.indexOf(v));
    // Se o algorítmo terminar sem nenhuma aresta infinita pendente, o ciclo está completo
    if (arestaInfinita == null) {
        return new ResultadoBusca(inicial, null, visitados, caminho, true, [], "Caxeiro Viajante");
    }
    else {
        return new ResultadoBusca(inicial, null, visitados, [], false, [], "Caxeiro Viajante");
    }
}

/////////////////////////
// Métodos utilitários //
/////////////////////////

function importarXMLGraphMax(grafoXml: any): Grafo {
    let grafo = new Grafo();

    // Grava as propriedades do grafo
    grafo.ponderado = (grafoXml.$.ponderado === "true");
    grafo.dirigido = (grafoXml.$.dirigido === "true");

    // Permite o uso do A* em qualquer grafo (baseando-se nas posições dos vértices)
    grafo.mapa = true;

    // Grava os vértices do grafo
    grafoXml.Vertices[0].Vertice.forEach(function(v: any) {
        let idVertice = parseInt(v.$.relId, 10);
        let rotulo = v.$.rotulo;
        let posicao = new Ponto(parseInt(v.$.posX, 10), parseInt(v.$.posY, 10));
        let vertice = new Vertice(idVertice, rotulo, posicao, posicao, grafo);
        grafo.vertices.push(vertice);
    });

    // Grava as arestas do grafo
    grafoXml.Arestas[0].Aresta.forEach(function(a: any) {
        let idOrigem = parseInt(a.$.idVertice1);
        let idDestino = parseInt(a.$.idVertice2);
        let origem = grafo.getVerticePorID(idOrigem);
        let destino = grafo.getVerticePorID(idDestino);
        let peso = parseFloat(a.$.peso);
        let arco = new Arco(origem, destino, peso);
        origem.arcos.push(arco);
        grafo.arcos.push(arco);
        // Cria um arco simétrico se o grafo não for direcionado
        if (grafo.dirigido === false) {
            let arco2 = new Arco(destino, origem, peso);
            destino.arcos.push(arco2);
            grafo.arcos.push(arco2);
        }
        // Se não, cria somente o arco inverso (para referência interna)
        else {
            destino.arcosInversos.push(arco);
        }
    });

    // Ordena os vértices
    grafo.vertices.sort((a, b) => a.compare(b));
    // E retorna o grafo construído
    return grafo;
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
    let grafo = new Grafo();
    let vertices = new Array<Vertice>(linhas * colunas);
    let arcos = new Array<Arco>();
    let id = 0;

    // Preenche a matriz
    for (let i = 0; i < linhas; i++) {
        for (let j = 0; j < colunas; j++) {
            // Cria o vértice se não houver barreira nessa posição
            if (!barreiras.find(p => p.x === i + 1 && p.y === j + 1)) {
                let vertice = new Vertice(id++, getNome(i, j), posTela(i, j), posReal(i, j), grafo);
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
                    let arco = new Arco(vertice, vizinho, 1);
                    vertice.arcos.push(arco);
                    arcos.push(arco);
                });
            }
        }
    }

    // Constroi e retorna o grafo
    grafo.mapa = true;
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
