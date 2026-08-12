
'use server';

/**
 * Server action to fetch CNPJ data from ReceitaWS or BrasilAPI.
 * Server-side execution avoids CORS issues and allows fallback strategies.
 */

export async function lookupCnpjAction(cnpj: string) {
  const cleanCnpj = cnpj.replace(/\D/g, "");
  if (cleanCnpj.length !== 14) {
    throw new Error("CNPJ inválido");
  }

  try {
    // Attempt 1: ReceitaWS (Strict but detailed)
    // Note: Free tier is 3 requests per minute.
    const rwsResponse = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
      next: { revalidate: 3600 }
    });

    if (rwsResponse.ok) {
      const data = await rwsResponse.json();
      if (data.status !== "ERROR") {
        // Extrair sócio administrador (QSA)
        const principalPartner = data.qsa?.find((p: any) => 
          p.qual?.toLowerCase().includes("administrador") || 
          p.qual?.toLowerCase().includes("sócio")
        )?.nome || "";

        const primCnae = data.atividade_principal?.[0];
        const primaryCnaeFormatted = primCnae ? (primCnae.text ? `${primCnae.code} - ${primCnae.text.toUpperCase()}` : primCnae.code) : "";

        return {
          corporateName: data.nome,
          nomeFantasia: data.fantasia || data.nome,
          cnpj: data.cnpj,
          openingDate: data.abertura ? data.abertura.split('/').reverse().join('-') : "",
          address: data.logradouro,
          numero: data.numero || "",
          complemento: data.complemento || "",
          neighborhood: data.bairro,
          city: data.municipio,
          state: data.uf,
          zipCode: data.cep.replace(/\D/g, ""),
          email: data.email,
          phone: data.telefone,
          primaryCnae: primaryCnaeFormatted,
          taxRegime: "Consultar no Portal",
          companyContactPerson: principalPartner.toUpperCase(),
          companyStatus: data.situacao || data.status || "",
          secondaryCnaes: data.atividades_secundarias?.map((c: any) => 
            c.text ? `${c.code} - ${c.text.toUpperCase()}` : c.code
          ) || [],
          qsa: data.qsa?.map((socio: any) => ({
            nome: socio.nome?.toUpperCase() || "",
            cpfCnpj: "",
            qualificacao: socio.qual || "",
            dataIngresso: "",
            participacao: 0,
            rg: "",
            rgOrgaoEmissor: "",
            rgUf: "",
            dataNascimento: "",
            estadoCivil: "Solteiro(a)",
            regimeBens: "",
            profissao: "",
            nacionalidade: "Brasileira",
            email: ""
          })) || []
        };
      }
    }

    // Attempt 2: BrasilAPI (Fast and reliable fallback)
    const bapiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    if (!bapiResponse.ok) throw new Error("CNPJ não localizado em nenhuma base pública");
    
    const bData = await bapiResponse.json();
    
    let regimeSugerido = "Outros";
    if (bData.opcao_pelo_mei) regimeSugerido = "MEI";
    else if (bData.opcao_pelo_simples) regimeSugerido = "Simples Nacional";

    // Extrair sócio administrador (BrasilAPI)
    const principalPartnerBapi = bData.qsa?.find((p: any) => 
      p.qualificacao_socio?.toLowerCase().includes("administrador") || 
      p.codigo_qualificacao_socio === 10 || 
      p.codigo_qualificacao_socio === 5
    )?.nome_socio || bData.qsa?.[0]?.nome_socio || "";

    const primCnaeBapi = bData.cnae_fiscal ? bData.cnae_fiscal.toString() : "";
    const primCnaeDescBapi = bData.cnae_fiscal_descricao || "";
    const primaryCnaeBapiFormatted = primCnaeBapi ? (primCnaeDescBapi ? `${primCnaeBapi} - ${primCnaeDescBapi.toUpperCase()}` : primCnaeBapi) : "";

    return {
      corporateName: bData.razao_social,
      nomeFantasia: bData.nome_fantasia || bData.razao_social,
      cnpj: bData.cnpj,
      openingDate: bData.data_inicio_atividade,
      address: bData.logradouro,
      numero: bData.numero || "",
      complemento: bData.complemento || "",
      neighborhood: bData.bairro,
      city: bData.municipio,
      state: bData.uf,
      zipCode: bData.cep,
      email: bData.email,
      phone: bData.ddd_telefone_1,
      primaryCnae: primaryCnaeBapiFormatted,
      taxRegime: regimeSugerido,
      companyContactPerson: principalPartnerBapi.toUpperCase(),
      companyStatus: bData.status || "",
      secondaryCnaes: bData.cnaes_secundarios?.map((c: any) => 
        c.descricao ? `${c.codigo} - ${c.descricao.toUpperCase()}` : c.codigo
      ) || [],
      qsa: bData.qsa?.map((socio: any) => ({
        nome: socio.nome_socio?.toUpperCase() || "",
        cpfCnpj: socio.cnpj_cpf_do_socio || "",
        qualificacao: socio.qualificacao_socio || "",
        dataIngresso: socio.data_entrada_sociedade || "",
        participacao: 0,
        rg: "",
        rgOrgaoEmissor: "",
        rgUf: "",
        dataNascimento: "",
        estadoCivil: "Solteiro(a)",
        regimeBens: "",
        profissao: "",
        nacionalidade: "Brasileira",
        email: ""
      })) || []
    };

  } catch (error: any) {
    console.error("CNPJ Lookup Error:", error);
    throw new Error(error.message || "Falha ao consultar CNPJ");
  }
}
