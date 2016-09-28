import * as electron from "electron";
import * as $ from "jquery";
import {desenhaGrafo} from "../src/lib/drawing";
import {
    Arco,
    Vertice,
    Grafo,
    GrafoAciclico,
    FuncaoBusca,
    ResultadoBusca,
    buscaBFS,
    buscaDFS,
    buscaDijkstra
}
from "../src/lib/grafos";

const contexto = (document.getElementById("grafo") as HTMLCanvasElement).getContext("2d");
let buscaCompleta = false;
let busca: ResultadoBusca;
let grafo: Grafo;

// Eventos do HTML
$(window).on("resize", event => {
    desenhaGrafo(contexto, grafo, busca, buscaCompleta);
});

$("#botao_abrir").on("click", () => {
    electron.ipcRenderer.once("set-grafo", (evento, grafoAciclico) => {
        if (grafoAciclico != null) {
            grafo = GrafoAciclico.prototype.toGrafo.apply(grafoAciclico);
            grafoCarregado(grafo);
            limparBusca();
        }
    });
    electron.ipcRenderer.send("abrir-grafo", "set-grafo");
});

$("#botao_limpar").on("click", () => {
    limparBusca();
});

$("#botao_info").on("click", () => {
    abrirModalResultadoBusca();
});

$("#botao_dfs").on("click", () => {
    buscar(buscaDFS);
});

$("#botao_bfs").on("click", () => {
    buscar(buscaBFS);
});

$("#botao_dijkstra").on("click", () => {
    buscar(buscaDijkstra);
});

$("#botao_dev").on("click", () => {
    electron.remote.getCurrentWebContents().toggleDevTools();
});

function grafoCarregado(grafo: Grafo) {
    // Preenche as opções da busca
    let selects = $("#grafo_v1, #grafo_v2");
    selects.empty();
    if (grafo != null) {
        $("#grafo_v2").append($("<option></option>").attr("value", "null").text("Indefinido"));
        grafo.vertices.forEach(vertice => {
            selects.append($("<option></option").attr("value", vertice.nome).text(vertice.nome));
        });
    }
    // Ativa os botões do menu
    $("#botao_dfs, #botao_bfs, #botao_conexo, #grafo_v1, #grafo_v2").each(function() {
        $(this).prop("disabled", grafo == null);
    });
    $("#botao_dijkstra").prop("disabled", grafo == null || !grafo.ponderado);
    selects.material_select();
    // Preenche as informações do grafo
    if (grafo != null) {
        $("#grafo_vertices").text(grafo.vertices.length);
        $("#grafo_arcos").text(grafo.dirigido ? grafo.arcos.length : grafo.arcos.length / 2);
        $("#grafo_direcionado").text(grafo.dirigido ? "Sim" : "Não");
        $("#grafo_ponderado").text(grafo.ponderado ? "Sim" : "Não");
        $("#grafo_conexo").text(grafo.isConexo() ? "Sim" : "Não");
    }
}

function chamarBusca(verticeInicial: string, verticeFinal: string, algoritmo: FuncaoBusca) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    let v2 = grafo.getVerticePorNome(verticeFinal);
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    if (v2 == null) {
        alert("O vértice " + verticeFinal + " não existe no grafo!");
        return;
    }
    buscaCompleta = false;
    busca = algoritmo(v1, v2);
    let percorridos = busca.visitados.map(vertice => vertice.nome);
    alert("Vértices percorridos a partir de " + verticeInicial + ": [" + percorridos.join(", ") + "]\nVértice " + verticeFinal + " encontrado: " + (busca.encontrado ? "Sim" : "Não") + "\nDistância (se Dijkstra): " + busca.distancia);
}

function chamarBuscaCompleta(verticeInicial: string, algoritmo: FuncaoBusca) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    limparBusca();
    buscaCompleta = true;
    busca = new ResultadoBusca(v1, null, new Array<Vertice>(), null, false, -1, "");
    // Percorre o grafo até todos os vértices terem sidos visistados, até os não conexos
    while (true) {
        busca.visitados.push(v1);
        let resultado = algoritmo(v1, null, busca.visitados);
        busca.nome = resultado.nome;
        busca.visitados = resultado.visitados;
        // Busca o próximo vértice não visitado
        let completo = grafo.vertices.every(vertice => {
            if (busca.visitados.find(visistado => vertice.equals(visistado))) {
                return true;
            }
            else {
                v1 = vertice;
                return false;
            }
        });
        // Termina o loop quando não houver mais nehnum vértice sobrando
        if (completo) {
            break;
        }
    }
    let percorridos = busca.visitados.map(vertice => vertice.nome);
    alert("Vértices percorridos a partir de " + verticeInicial + " (busca completa): [" + percorridos.join(", ") + "]");
}

function buscar(algoritmo: FuncaoBusca) {
    if (grafo != null) {
        let v1 = $("#grafo_v1").val();
        let v2 = $("#grafo_v2").val();
        // Não alterar, o valor do null é representado em string no HTML
        if (v2 !== "null") {
            chamarBusca(v1, v2, algoritmo);
        }
        else {
            chamarBuscaCompleta(v1, algoritmo);
        }
        $("#botao_limpar").removeClass("disabled").addClass("waves-effect");
        $("#botao_info").removeClass("disabled").addClass("waves-effect");
        desenhaGrafo(contexto, grafo, busca, buscaCompleta);
    }
}

function limparBusca() {
    if (busca) {
        busca = null;
        buscaCompleta = false;
        $("#botao_limpar").addClass("disabled").removeClass("waves-effect");
        $("#botao_info").addClass("disabled").removeClass("waves-effect");
    }
    desenhaGrafo(contexto, grafo, busca, buscaCompleta);
}

function abrirModalResultadoBusca() {
    if (busca) {
        $("#modal_caminho").openModal();
    }
}

grafoCarregado(null);
