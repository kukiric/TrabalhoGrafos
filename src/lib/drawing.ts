import {Grafo, Vertice, Arco, ResultadoBusca} from "./grafos";

let coresPadrao = ["salmon", "lightgreen", "lightblue", "yellow", "orange", "cyan"];

// Função adaptada do StackOverflow
// Usuário: http://stackoverflow.com/users/796329/titus-cieslewski
// Postagem: http://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag/6333775#6333775
function canvas_arrow(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
    const headlen = 10; // length of head in pixels
    const arrowangle = 6; // 360 degrees divided by this = actual angle
    const angle = Math.atan2(toy - fromy, tox - fromx);
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / arrowangle), toy - headlen * Math.sin(angle - Math.PI / arrowangle));
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / arrowangle), toy - headlen * Math.sin(angle + Math.PI / arrowangle));
    context.lineTo(tox, toy);
    context.fill();
}

// Retorna o ponto central de um conjunto usando funções getter
function findCentro(elementos: any[], getx: (el: any) => number, gety: (el: any) => number) {
    let minX = getx(elementos[0]), minY = gety(elementos[0]);
    let maxX = minX, maxY = minY;
    elementos.slice(1).forEach(elemento => {
        let x = getx(elemento), y = gety(elemento);
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
    });
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2};
}

// Retorna se o v2 encontra-se após o v1 no caminho
function isNoCaminho(caminho: Vertice[], v1: Vertice, v2: Vertice) {
    return caminho.slice(0, caminho.length - 1).find((v, indice) => v.equals(v1) && v2.equals(caminho[indice + 1])) != null;
}

// (Re-)desenha um grafo no canvas
export function desenhaGrafo(contexto: CanvasRenderingContext2D, grafo: Grafo, busca: ResultadoBusca, buscaCompleta: boolean, cores: Map<Vertice, number>) {
    busca = busca || new ResultadoBusca(null, null, [], [], false, [], "");
    const raioVertice = 16;
    const larguraLinha = 2;
    contexto.canvas.width = contexto.canvas.scrollWidth;
    contexto.canvas.height = contexto.canvas.scrollHeight;
    contexto.clearRect(0, 0, contexto.canvas.width, contexto.canvas.height);
    if (grafo == null) {
        return;
    }
    // Calcula o centro do canvas e do grafo
    let centroCanvas = {x: contexto.canvas.width / 2, y: contexto.canvas.height / 2};
    let centroGrafo = findCentro(grafo.vertices, (v) => v.posTela.x, (v) => v.posTela.y);
    // Funções de desenho no canvas
    function drawVertice(vertice: Vertice) {
        let x = centroCanvas.x + vertice.posTela.x - centroGrafo.x;
        let y = centroCanvas.y + vertice.posTela.y - centroGrafo.y;
        contexto.beginPath();
        contexto.lineWidth = larguraLinha * 2;
        contexto.strokeStyle = "black";
        contexto.arc(x, y, raioVertice, 0, 2 * Math.PI);
        contexto.stroke();
        // Maior prioridade: pintar a coloração
        if (cores) {
            let indice = cores.get(vertice) % coresPadrao.length;
            contexto.fillStyle = coresPadrao[indice];
        }
        // Pinta os vértices do caminho encontrado em um destaque, e os outros percorridos em outro
        else if (busca.atuais && busca.atuais.find(outroVertice => vertice.equals(outroVertice))) {
            contexto.fillStyle = "#5dc7f4";
        }
        else if (busca.checado && busca.checado.equals(vertice)) {
            contexto.fillStyle = "#9bdbf7";
        }
        else if (busca.abertos && busca.abertos.find(outroVertice => vertice.equals(outroVertice))) {
            contexto.fillStyle = "white";
        }
        else if (buscaCompleta || busca.caminho.find(outroVertice => vertice.equals(outroVertice))) {
            contexto.fillStyle = "#64e764";
        }
        else if (busca.visitados.find(outroVertice => vertice.equals(outroVertice))) {
            contexto.fillStyle = "#ff6e38";
        }
        else {
            contexto.fillStyle = "lightgray";
        }
        contexto.arc(x, y, raioVertice, 0, 2 * Math.PI);
        contexto.fill();
        contexto.fillStyle = "black";
        contexto.textAlign = "center";
        contexto.font = "12px sans-serif";
        contexto.fillText(vertice.nome, x, y + 4);
    }
    function drawArco(v1: Vertice, v2: Vertice, peso: number, destacar: boolean) {
        let x1 = centroCanvas.x + v1.posTela.x - centroGrafo.x;
        let y1 = centroCanvas.y + v1.posTela.y - centroGrafo.y;
        let x2 = centroCanvas.x + v2.posTela.x - centroGrafo.x;
        let y2 = centroCanvas.y + v2.posTela.y - centroGrafo.y;
        let angulo = Math.atan2(y2 - y1, x2 - x1);
        // Desloca o início e o fim da linha até os raios dos vértices
        let distancia = raioVertice + larguraLinha;
        x1 += distancia * Math.cos(angulo);
        y1 += distancia * Math.sin(angulo);
        x2 -= distancia * Math.cos(angulo);
        y2 -= distancia * Math.sin(angulo);
        // Pinta as arestas que fazem parte do caminho em destaque
        if (destacar) {
            contexto.strokeStyle = "black";
            contexto.fillStyle = "black";
        }
        else {
            contexto.strokeStyle = "lightgray";
            contexto.fillStyle = "lightgray";
        }
        contexto.lineWidth = larguraLinha;
        contexto.beginPath();
        contexto.moveTo(x1, y1);
        contexto.lineTo(x2, y2);
        contexto.stroke();
        // Desenha a seta somente se o grafo for direcionado
        if (grafo.dirigido) {
            canvas_arrow(contexto, x1, y1, x2, y2);
        }
        // E o peso da aresta somente se o grafo for ponderado
        if (grafo.ponderado) {
            let centro = {
                x: (x1 + x2) / 2,
                y: (y1 + y2) / 2 + 4
            };
            let w = contexto.measureText(peso.toString()).width + 4;
            let h = 16;
            let x = centro.x - w / 2;
            let y = centro.y - h / 2 - 4;
            contexto.fillStyle = "white";
            contexto.fillRect(x, y, w, h);
            contexto.fillStyle = destacar ? "black" : "lightgray";
            contexto.font = "12px sans-serif";
            contexto.textAlign = "center";
            contexto.fillText(peso.toString(), centro.x, centro.y);
        }
    }
    // Desenha todos os arcos fora do caminho primeiro
    type ArcoCaminho = {
        v1: Vertice,
        v2: Vertice,
        peso: number
    };
    let arcosCaminho = new Array<ArcoCaminho>();
    grafo.vertices.forEach(v1 => {
        v1.adjacentesComPesos.forEach(v2_peso => {
            if (buscaCompleta || !busca.encontrado || isNoCaminho(busca.caminho, v1, v2_peso.v)) {
                // Enfileira o arco para ser desenhado mais tarde
                arcosCaminho.push({v1: v1, v2: v2_peso.v, peso: v2_peso.p});
            }
            else {
                drawArco(v1, v2_peso.v, v2_peso.p, false);
            }
        });
    });
    // Depois os arcos que fazem parte do caminho por cima
    arcosCaminho.forEach(par => {
        drawArco(par.v1, par.v2, par.peso, true);
    });
    // E finalmente os vértices
    grafo.vertices.forEach(vertice => {
        drawVertice(vertice);
    });
}
