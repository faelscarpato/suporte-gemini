document.addEventListener('DOMContentLoaded', async () => {
    const fabricanteSelect = document.getElementById('fabricante');
    const modeloSelect = document.getElementById('modelo');
    const anoSelect = document.getElementById('ano');
    const assuntoSelect = document.getElementById('assunto');
    const perguntaInput = document.getElementById('pergunta');
    const enviarButton = document.getElementById('enviar');
    const respostaGeminiDiv = document.getElementById('resposta-gemini');
    const documentosRelacionadosDiv = document.getElementById('documentos-relacionados');

    // Variável para armazenar as marcas e modelos
    let marcasModelos;

    // Função para carregar marcas e modelos do arquivo JSON
    async function carregarMarcasModelos() {
        try {
            const response = await fetch('data/marcas_modelos.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao carregar marcas e modelos:', error);
            alert('Erro ao carregar a lista de marcas e modelos. Verifique o console.');
            return null;
        }
    }

    // Preencher select de fabricantes
    function preencherFabricantes(marcasModelos) {
        for (const fabricante in marcasModelos) {
            if (marcasModelos.hasOwnProperty(fabricante)) {
                const option = document.createElement('option');
                option.value = fabricante; // Usar o nome original do fabricante como valor
                option.textContent = fabricante;
                fabricanteSelect.appendChild(option);
            }
        }
    }

    // Preencher select de modelos
    function preencherModelos(marcasModelos, fabricanteSelecionado) {
        modeloSelect.innerHTML = '<option value="">Selecione o Modelo</option>';

        if (fabricanteSelecionado && marcasModelos[fabricanteSelecionado]) {
            const modelos = marcasModelos[fabricanteSelecionado].models;
            modelos.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.toLowerCase().replace(/ /g, '-');
                option.textContent = modelo;
                modeloSelect.appendChild(option);
            });
        }
    }

    // Preencher select de anos
    function preencherAnos() {
        for (let ano = 2010; ano <= 2025; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            anoSelect.appendChild(option);
        }
    }

    enviarButton.addEventListener('click', async () => {
        const fabricante = fabricanteSelect.value;
        const modelo = modeloSelect.value;
        const ano = anoSelect.value;
        const assunto = assuntoSelect.value;
        const pergunta = perguntaInput.value;

        let perguntaCompleta = "";

        if (fabricante) {
            perguntaCompleta += `Fabricante: ${fabricante}. `;
        }
        if (modelo) {
            perguntaCompleta += `Modelo: ${modelo}. `;
        }
        if (ano) {
            perguntaCompleta += `Ano: ${ano}. `;
        }
        if (assunto) {
            perguntaCompleta += `Assunto: ${assunto}. `;
        }

        perguntaCompleta += pergunta;

        if (perguntaCompleta.trim() !== "") { // Verifica se a pergunta não está vazia
            const resposta = await obterRespostaGemini(perguntaCompleta);
            const respostaFormatada = formatarResposta(resposta);
            respostaGeminiDiv.innerHTML = respostaFormatada;

            const documentos = await buscarDocumentosRelacionados(perguntaCompleta);
            exibirDocumentosRelacionados(documentos, documentosRelacionadosDiv);
        } else {
            alert('Por favor, selecione os critérios de pesquisa ou digite uma pergunta.');
        }
    });

    async function buscarDocumentosRelacionados(pergunta) {
        const respostaGeminiDiv = document.getElementById('resposta-gemini');
        const documentosRelacionadosDiv = document.getElementById('documentos-relacionados');

        try {
        const response = await fetch('data/index.json'); // Carrega o index.json
        const index = await response.json();

        const palavrasPergunta = pergunta.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

        const documentosRelevantes = index.map(documento => {
            let pontuacao = 0;
            documento.palavras_chave.forEach(palavraChave => {
                if (palavrasPergunta.includes(palavraChave)) {
                    pontuacao++; // Aumenta a pontuação se a palavra-chave estiver na pergunta
                }
            });
            return { documento, pontuacao };
        })
        .filter(item => item.pontuacao > 0) // Filtra documentos com pontuação maior que zero
        .sort((a, b) => b.pontuacao - a.pontuacao) // Ordena por pontuação decrescente
        .map(item => item.documento); // Extrai apenas os documentos

        return documentosRelevantes;

        } catch (error) {
        console.error('Erro ao buscar documentos relacionados:', error);
        respostaGeminiDiv.textContent = "Erro ao obter lista de documentos. Por favor, tente novamente.";
        return []; // Retorna um array vazio em caso de erro
        }
    }

    function formatarResposta(texto) {
        let textoFormatado = texto.replace(/\n/g, '<br>');
        textoFormatado = textoFormatado.replace(/\*\*(.+?)\*\*/g, '<h3>$1</h3>');
        textoFormatado = textoFormatado.replace(/\*(.+?)\*/g, '<b>$1</b>');
        textoFormatado = textoFormatado.replace(/^(\*|-)\s+(.+)$/gm, '<li>$2</li>');
        textoFormatado = '<ul>' + textoFormatado.replace(/<li>/g, '</li><li>') + '</ul>';
        textoFormatado = textoFormatado.replace('<ul></ul>', ''); // Remove <ul></ul> vazios
        return textoFormatado;
    }

 function exibirDocumentosRelacionados(documentos, div) {
        div.innerHTML = ''; // Limpa o conteúdo anterior
        if (documentos.length > 0) {
            const lista = document.createElement('ul');
            documentos.forEach(doc => {
                const item = document.createElement('li');
                
                // Check if the document is a PDF file
                if (doc.arquivo.toLowerCase().endsWith('.pdf')) {
                    const link = document.createElement('a');
                     link.href = '#'; // Remover a navegação padrão
                     link.textContent = doc.titulo;
                     link.dataset.arquivoPdf = doc.arquivo;

                      link.addEventListener('click', (event) => {
                          event.preventDefault();
                           const arquivoPdf = event.target.dataset.arquivoPdf;
                           exibirPdf(arquivoPdf);
                       });

                     item.appendChild(link);
                } else {
                    // If not PDF just normally show
                      const link = document.createElement('a');
                      link.href = doc.arquivo; // Define o link para o arquivo
                      link.textContent = doc.titulo; // Define o texto do link
                      link.target = "_blank"; // Abre o link em uma nova aba

                      item.appendChild(link); // Adiciona o link ao item da lista
                }

                lista.appendChild(item);
            });
            div.appendChild(lista);
        } else {
            div.textContent = 'Nenhum documento relacionado encontrado.';
        }
    }

     async function exibirPdf(arquivoPdf) {
        const visualizadorPdf = document.getElementById('visualizador-pdf');
        const pdfCanvas = document.getElementById('pdf-canvas');
        const pdfjsLib = window['pdfjs-dist/build/pdf'];

        // Configura o worker do PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs/build/pdf.worker.js'; // Ajuste se necessário

        try {
            // Carrega o PDF
            const pdf = await pdfjsLib.getDocument(arquivoPdf).promise;

            // Obtém a primeira página
            const pagina = await pdf.getPage(1);

            // Configura o canvas
            const viewport = pagina.getViewport({ scale: 1.5 }); // Ajuste a escala conforme necessário
            const context = pdfCanvas.getContext('2d');
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            // Renderiza a página no canvas
            const renderContext = {
                
                canvasContext: context,
                viewport: viewport
            };
            await pagina.render(renderContext).promise;

            // Exibe o visualizador de PDF
            visualizadorPdf.style.display = 'block';

        } catch (error) {
            console.error('Erro ao exibir PDF:', error);
            alert('Erro ao carregar o PDF. Verifique o console para mais detalhes.');
        }
    }
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function convertToSlug(Text) {
        return Text
            .toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'');
    }

    // Inicialização
    marcasModelos = await carregarMarcasModelos();
    if (marcasModelos) {
        preencherFabricantes(marcasModelos);
        preencherAnos(); // Preencher anos ao carregar a página

        // Listener para popular os modelos quando o fabricante mudar
        fabricanteSelect.addEventListener('change', () => {
            preencherModelos(marcasModelos, fabricanteSelect.value);
        });
    }

    
});