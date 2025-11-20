
export interface BrasilApiCompany {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  ddd_telefone_1: string;
  email: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
}

export const fetchCnpjData = async (cnpj: string): Promise<BrasilApiCompany | null> => {
  // Remove caracteres não numéricos
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');

  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos.');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      if (response.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.');
      if (response.status === 429) throw new Error('Muitas requisições. Tente novamente em instantes.');
      throw new Error('Erro ao consultar Receita Federal.');
    }

    const data = await response.json();
    return data as BrasilApiCompany;
  } catch (error) {
    console.error("BrasilAPI Error:", error);
    throw error;
  }
};
