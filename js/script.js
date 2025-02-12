document.addEventListener('DOMContentLoaded', async () => {
    const fabricanteSelect = document.getElementById('fabricante');
    const anoSelect = document.getElementById('ano');
    const modeloSelect = document.getElementById('modelo');
    const assuntoSelect = document.getElementById('assunto');
    const perguntaInput = document.getElementById('pergunta');
    const enviarButton = document.getElementById('enviar');
    const respostaGeminiDiv = document.getElementById('resposta-gemini');
    const documentosRelacionadosDiv = document.getElementById('documentos-relacionados');

    // Preencher o menu de modelos
    try {
        const response = await fetch('data/index.json');
        const index = await response.json();
        const modelos = [...new Set(index.map(doc => doc.titulo))]; // Obtém modelos únicos

        modelos.forEach(modelo => {
            const option = document.createElement('option');
            option.value = modelo;
            option.textContent = modelo;
            modeloSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
    }

    enviarButton.addEventListener('click', async () => {
        const fabricante = fabricanteSelect.value;
        const ano = anoSelect.value;
        const modelo = modeloSelect.value;
        const assunto = assuntoSelect.value;
        const pergunta = perguntaInput.value;

        let perguntaCompleta = "";

        if (fabricante) {
            perguntaCompleta += `Fabricante: ${fabricante}. `;
        }
        if (ano) {
            perguntaCompleta += `Ano: ${ano}. `;
        }
        if (modelo) {
            perguntaCompleta += `Modelo: ${modelo}. `;
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
                const link = document.createElement('a');
                link.href = '#'; // Remove link direto
                link.textContent = doc.titulo;
                link.dataset.arquivoPdf = doc.arquivo; // Armazena o caminho do PDF no atributo data

                link.addEventListener('click', (event) => {
                    event.preventDefault(); // Evita o download padrão
                    const arquivoPdf = event.target.dataset.arquivoPdf;
                    exibirPdf(arquivoPdf);
                });

                item.appendChild(link);
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
});