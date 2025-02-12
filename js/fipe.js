document.addEventListener('DOMContentLoaded', async () => {
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ODdiN2E5OC1mYWQ1LTRkYzQtODVhYi1kY2EwZjE4ZTIzYjQiLCJlbWFpbCI6ImZhZWxzY2FycGF0b0BnbWFpbC5jb20iLCJpYXQiOjE3MzkzMTA3Njl9.4dcLnyZtK7QIE22dlKXvJkHjgLfCKaip7heKMQ5Xm7I';

    const vehicleTypeSelect = document.getElementById('vehicleType');
    const referenceSelect = document.getElementById('reference');
    const brandSelect = document.getElementById('brand');
    const modelSelect = document.getElementById('model');
    const yearSelect = document.getElementById('year');
    const consultarButton = document.getElementById('consultar');
    const fipeResultadosSection = document.getElementById('fipe-resultados');
    const fipeDetalhesDiv = document.getElementById('fipe-detalhes');

    const baseUrl = 'https://fipe.parallelum.com.br/api/v2';

    // Função para fazer requisições à API FIPE
    async function fetchData(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'X-Subscription-Token': apiKey
                }
            });
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            alert('Ocorreu um erro ao buscar os dados. Consulte o console para mais detalhes.');
            return null;
        }
    }

    // Preencher o select de referências
    async function preencherReferencias() {
        const referencias = await fetchData(`${baseUrl}/references`);
        if (referencias) {
            referencias.forEach(ref => {
                const option = document.createElement('option');
                option.value = ref.code;
                option.textContent = ref.month;
                referenceSelect.appendChild(option);
            });
        }
    }

    // Preencher o select de marcas
    async function preencherMarcas(vehicleType, reference) {
        brandSelect.innerHTML = '<option value="">Selecione a Marca</option>'; // Limpar as opções
        const marcas = await fetchData(`${baseUrl}/${vehicleType}/brands?reference=${reference}`);
        if (marcas) {
            marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.code;
                option.textContent = marca.name;
                brandSelect.appendChild(option);
            });
        }
    }

    // Preencher select de modelos
    async function preencherModelos(vehicleType, brandId, reference) {
        modelSelect.innerHTML = '<option value="">Selecione o Modelo</option>'; // Limpar as opções
        const modelos = await fetchData(`${baseUrl}/${vehicleType}/brands/${brandId}/models?reference=${reference}`);
        if (modelos) {
            modelos.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.code;
                option.textContent = modelo.name;
                modelSelect.appendChild(option);
            });
        }
    }

    // Preencher select de anos
    async function preencherAnos(vehicleType, brandId, modelId, reference) {
        yearSelect.innerHTML = '<option value="">Selecione o Ano</option>'; // Limpar
        const anos = await fetchData(`${baseUrl}/${vehicleType}/brands/${brandId}/models/${modelId}/years?reference=${reference}`);
        if (anos) {
            anos.forEach(ano => {
                const option = document.createElement('option');
                option.value = ano.code;
                option.textContent = ano.name;
                yearSelect.appendChild(option);
            });
        }
    }

    // Consultar preço
    async function consultarPreco(vehicleType, brandId, modelId, yearId, reference) {
        const detalhes = await fetchData(`${baseUrl}/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}?reference=${reference}`);
        if (detalhes) {
            fipeDetalhesDiv.innerHTML = `
                <p><strong>Marca:</strong> ${detalhes.brand}</p>
                <p><strong>Modelo:</strong> ${detalhes.model}</p>
                <p><strong>Ano:</strong> ${detalhes.modelYear}</p>
                <p><strong>Preço:</strong> ${detalhes.price}</p>
                <p><strong>Mês de Referência:</strong> ${detalhes.referenceMonth}</p>
                <p><strong>Código FIPE:</strong> ${detalhes.codeFipe}</p>
                <p><strong>Combustível:</strong> ${detalhes.fuel}</p>
            `;
            fipeResultadosSection.style.display = 'block'; // Mostrar resultados
        } else {
            fipeDetalhesDiv.innerHTML = '<p>Nenhum resultado encontrado.</p>';
            fipeResultadosSection.style.display = 'none';
        }
    }

    // Event listeners
    vehicleTypeSelect.addEventListener('change', () => {
        preencherMarcas(vehicleTypeSelect.value, referenceSelect.value);
    });

    referenceSelect.addEventListener('change', () => {
        preencherMarcas(vehicleTypeSelect.value, referenceSelect.value);
    });

    brandSelect.addEventListener('change', () => {
        preencherModelos(vehicleTypeSelect.value, brandSelect.value, referenceSelect.value);
    });

    modelSelect.addEventListener('change', () => {
        preencherAnos(vehicleTypeSelect.value, brandSelect.value,modelSelect.value, referenceSelect.value);
    });

    consultarButton.addEventListener('click', () => {
        consultarPreco(
            vehicleTypeSelect.value,
            brandSelect.value,
            modelSelect.value,
            yearSelect.value,
            referenceSelect.value
        );
    });

    // Inicialização
    await preencherReferencias(); // Preencher as referências ao carregar a página
    preencherMarcas(vehicleTypeSelect.value, referenceSelect.value); // Carregar marcas iniciais
});