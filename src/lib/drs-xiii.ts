/**
 * DRS-XIII Ribeirão Preto — Departamento Regional de Saúde XIII (SP)
 * Lista de cidades cobertas para fins epidemiológicos.
 */
export const DRS_XIII_CIDADES = [
  "Altinópolis",
  "Barrinha",
  "Batatais",
  "Brodowski",
  "Cajuru",
  "Cássia dos Coqueiros",
  "Cravinhos",
  "Dumont",
  "Guariba",
  "Guatapará",
  "Jaboticabal",
  "Jardinópolis",
  "Luís Antônio",
  "Monte Alto",
  "Pitangueiras",
  "Pontal",
  "Pradópolis",
  "Ribeirão Preto",
  "Santa Cruz da Esperança",
  "Santa Rosa de Viterbo",
  "Santo Antônio da Alegria",
  "São Simão",
  "Serra Azul",
  "Serrana",
  "Sertãozinho",
  "Taquaral",
] as const;

export type DRSCidade = (typeof DRS_XIII_CIDADES)[number];

/** Bairros conhecidos de Ribeirão Preto (lista sugestiva, editável). */
export const RP_BAIRROS = [
  "Centro",
  "Campos Elíseos",
  "Ipiranga",
  "Jardim Paulista",
  "Vila Tibério",
  "Sumarezinho",
  "Monte Alegre",
  "Iguatemi",
  "Ribeirânia",
  "Jardim Independência",
  "Vila Virgínia",
  "Quintino Facci",
  "Adão do Carmo Leonel",
  "Jardim Aeroporto",
  "Jardim Castelo Branco",
  "Lagoinha",
  "Planalto Verde",
  "Bonfim Paulista",
  "Outro",
] as const;
