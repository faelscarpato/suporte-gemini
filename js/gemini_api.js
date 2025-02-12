const GEMINI_API_KEY = 'AIzaSyC9nugOsyOHZehmDwlrXKS5aXMFxrtwcG0'; // Sua chave de API

async function obterRespostaGemini(pergunta) {
    const perguntaComInstrucao = "Responda em português brasileiro: " + pergunta;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const data = {
        contents: [{
            parts: [{ text: perguntaComInstrucao }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const resposta = json.candidates[0].content.parts[0].text;
        return resposta;

    } catch (error) {
        console.error("Erro ao obter resposta da Gemini:", error);
        return "Erro ao obter resposta. Por favor, tente novamente.";
    }
}