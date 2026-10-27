
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

        let regimeSugerido = "Outros";
        if (data.simei?.optante === true) {
          regimeSugerido = "MEI";
        } else if (data.simples?.optante === true) {
          regimeSugerido = "Simples Nacional";
        }

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
          taxRegime: regimeSugerido,
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
    try {
      const bapiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (bapiResponse.ok) {
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
      }
    } catch (e) {
      console.warn("BrasilAPI failed, trying CNPJ.ws...", e);
    }

    // Attempt 3: CNPJ.ws (Public and Free API fallback)
    try {
      const wsResponse = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`);
      if (wsResponse.ok) {
        const wsData = await wsResponse.json();
        
        let regimeSugerido = "Outros";
        if (wsData.simples?.mei?.toLowerCase() === "sim") {
          regimeSugerido = "MEI";
        } else if (wsData.simples?.simples?.toLowerCase() === "sim") {
          regimeSugerido = "Simples Nacional";
        }

        // Extrair sócio administrador (CNPJ.ws)
        const principalPartnerWs = wsData.socios?.find((p: any) => 
          p.qualificacao_socio?.nome?.toLowerCase().includes("administrador") || 
          p.qualificacao_socio?.nome?.toLowerCase().includes("sócio")
        )?.nome || wsData.socios?.[0]?.nome || "";

        const est = wsData.estabelecimento || {};
        const primCnaeWs = est.atividade_principal?.codigo || "";
        const primCnaeDescWs = est.atividade_principal?.descricao || "";
        const primaryCnaeWsFormatted = primCnaeWs ? (primCnaeDescWs ? `${primCnaeWs} - ${primCnaeDescWs.toUpperCase()}` : primCnaeWs) : "";

        return {
          corporateName: wsData.razao_social,
          nomeFantasia: est.nome_fantasia || wsData.razao_social,
          cnpj: est.cnpj || cleanCnpj,
          openingDate: est.data_inicio_atividade || "",
          address: est.logradouro || "",
          numero: est.numero || "",
          complemento: est.complemento || "",
          neighborhood: est.bairro || "",
          city: est.cidade?.nome || "",
          state: est.estado?.sigla || "",
          zipCode: est.cep?.replace(/\D/g, "") || "",
          email: est.email || "",
          phone: est.telefone1 || est.telefone2 || "",
          primaryCnae: primaryCnaeWsFormatted,
          taxRegime: regimeSugerido,
          companyContactPerson: principalPartnerWs.toUpperCase(),
          companyStatus: est.situacao_cadastral || "",
          secondaryCnaes: est.atividades_secundarias?.map((c: any) => 
            c.descricao ? `${c.codigo} - ${c.descricao.toUpperCase()}` : c.codigo
          ) || [],
          qsa: wsData.socios?.map((socio: any) => ({
            nome: socio.nome?.toUpperCase() || "",
            cpfCnpj: socio.cnpj_cpf_do_socio || "",
            qualificacao: socio.qualificacao_socio?.nome || "",
            dataIngresso: socio.data_ingresso || "",
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
    } catch (e) {
      console.warn("CNPJ.ws fallback failed:", e);
    }

    throw new Error("CNPJ não localizado em nenhuma base pública");

  } catch (error: any) {
    console.error("CNPJ Lookup Error:", error);
    throw new Error(error.message || "Falha ao consultar CNPJ");
  }
}
