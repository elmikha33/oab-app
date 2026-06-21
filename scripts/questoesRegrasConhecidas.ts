export type RegraQuestaoConhecida = {
  instituto_central: string;
  evitar: string[];
  comentario_seguro: string;
};

export const QUESTOES_REGRAS_CONHECIDAS: Record<number, RegraQuestaoConhecida> = {
  93: {
    instituto_central: "proibicao absoluta da tortura",
    evitar: ["Corte Interamericana", "OEA", "jurisdicao", "tratados internacionais"],
    comentario_seguro:
      "A alternativa D est\u00e1 correta porque a tortura \u00e9 proibida de forma absoluta, inclusive em situa\u00e7\u00f5es excepcionais como guerra, emerg\u00eancia p\u00fablica ou amea\u00e7a \u00e0 seguran\u00e7a nacional. A veda\u00e7\u00e3o \u00e0 tortura n\u00e3o pode ser afastada por circunst\u00e2ncias extraordin\u00e1rias, pois protege a dignidade da pessoa humana e impede tratamentos cru\u00e9is, desumanos ou degradantes.",
  },
  94: {
    instituto_central: "uni\u00e3o est\u00e1vel e sucess\u00e3o",
    evitar: ["div\u00f3rcio", "separa\u00e7\u00e3o judicial", "separa\u00e7\u00e3o de fato"],
    comentario_seguro:
      "A alternativa A est\u00e1 correta porque a uni\u00e3o est\u00e1vel produz efeitos jur\u00eddicos relevantes no Direito de Fam\u00edlia e no Direito Sucess\u00f3rio. Para fins sucess\u00f3rios, o companheiro sobrevivente possui prote\u00e7\u00e3o jur\u00eddica semelhante \u00e0 conferida ao c\u00f4njuge, de modo que a solu\u00e7\u00e3o da quest\u00e3o deve observar a equipara\u00e7\u00e3o da uni\u00e3o est\u00e1vel ao casamento quanto aos efeitos patrimoniais e sucess\u00f3rios aplic\u00e1veis ao caso.",
  },
};

export function obterRegraQuestaoConhecida(id: unknown) {
  const numero = Number(id);
  return Number.isInteger(numero) ? QUESTOES_REGRAS_CONHECIDAS[numero] || null : null;
}
