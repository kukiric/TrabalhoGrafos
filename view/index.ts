// Estilos
import "material-design-icons-iconfont/dist/material-design-icons.css";
import "materialize-css/dist/css/materialize.css";
import "./index.css";

// Bibliotecas
import "jquery";
import "materialize-css";
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
    buscaDijkstra,
    importarXML
}
from "../src/lib/grafos";

const contexto = (document.getElementById("grafo") as HTMLCanvasElement).getContext("2d");
let buscaCompleta = false;
let distancias: number[];
let busca: ResultadoBusca;
let grafo: Grafo;

// Eventos do HTML
$(window).on("resize", () => {
    desenhaGrafo(contexto, grafo, busca, buscaCompleta);
});

$("#input_grafo").on("change", () => {
    let input = $("#input_grafo").get(0) as HTMLInputElement;
    let arquivo = input.files[0];
    if (arquivo != null) {
        // Limpa o canvas e bloqueia os botões
        grafo = null;
        limparBusca();
        grafoCarregado();
        // Carrega o novo grafo
        importarXML(arquivo, (novoGrafo) => {
            grafo = novoGrafo;
            grafoCarregado();
        });
    }
});

$("#botao_limpar").on("click", () => {
    limparBusca();
});

$("#botao_info").on("click", () => {
    if (busca) {
        $("#modal_caminho").openModal();
    }
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

function grafoCarregado() {
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
    desenhaGrafo(contexto, grafo, busca, buscaCompleta);
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
    distancias = null;
    buscaCompleta = false;
    busca = algoritmo(v1, v2);
}

function chamarBuscaCompleta(verticeInicial: string, algoritmo: FuncaoBusca) {
    let v1 = grafo.getVerticePorNome(verticeInicial);
    if (v1 == null) {
        alert("O vértice " + verticeInicial + " não existe no grafo!");
        return;
    }
    limparBusca();
    let conexo = true;
    buscaCompleta = true;
    busca = new ResultadoBusca(v1, null, new Array<Vertice>(), new Array<Vertice>(), false, new Array<number>(), "");
    // Percorre o grafo até todos os vértices terem sidos visistados, até os não conexos
    while (true) {
        busca.visitados.push(v1);
        let resultado = algoritmo(v1, null, busca.visitados);
        busca.nome = resultado.nome;
        busca.visitados = resultado.visitados;
        // Só adiciona distâncias finitas enquanto a busca for conexa
        if (conexo) {
            busca.distancias = busca.distancias.concat(resultado.distancias);
        }
        else {
            busca.distancias = busca.distancias.concat(resultado.distancias.map(d => -1));
        }
        // Busca o próximo vértice não visitado
        let completo = grafo.vertices.every(vertice => {
            if (busca.visitados.find(visistado => vertice.equals(visistado))) {
                return true;
            }
            else {
                v1 = vertice;
                conexo = false;
                return false;
            }
        });
        // Termina o loop quando não houver mais nehnum vértice sobrando
        if (completo) {
            break;
        }
    }
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
        atualizarModalBusca();
        desenhaGrafo(contexto, grafo, busca, buscaCompleta);
    }
}

function limparBusca() {
    if (busca) {
        busca = null;
        distancias = null;
        buscaCompleta = false;
        $("#botao_limpar").addClass("disabled").removeClass("waves-effect");
        $("#botao_info").addClass("disabled").removeClass("waves-effect");
    }
    desenhaGrafo(contexto, grafo, busca, buscaCompleta);
}

function atualizarModalBusca() {
    if (busca) {
        let contemDistancias = busca.distancias.length > 0 && busca.distancias[0] >= 0;
        $("#busca_nome").text(busca.nome);
        $("#busca_v1").text(busca.inicial.nome);
        $("#busca_v2").text(busca.procurado ? busca.procurado.nome : "Todos");
        let visitados = contemDistancias
            ? busca.visitados.map((v, i) => `${v.nome} (${busca.distancias[i] >= 0 ? busca.distancias[i] : "∞"})`)
            : busca.visitados.map(v => v.nome);
        $("#busca_visitados").text(visitados.join(" > "));
        $("#busca_caminho").text(busca.caminho.length > 0 ? busca.caminho.map(v => v.nome).join(" > ") : "Nenhum");
        let distanciaFinal = busca.encontrado ? busca.distancias[busca.visitados.findIndex(e => e.equals(busca.procurado))] : "-1";
        $("#busca_custo").text(buscaCompleta || !contemDistancias ? "" : "Custo para o destino: " + (distanciaFinal >= 0 ? distanciaFinal.toString() : "∞"));
        $("#modal_caminho").openModal();
    }
}

grafoCarregado();
