export const apenasDigitos = (valor: string) => valor.replace(/\D/g, "");

export function formatarCelular(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 11);
  const ddd = digitos.slice(0, 2);
  const inicio = digitos.slice(2, 7);
  const fim = digitos.slice(7, 11);

  if (digitos.length <= 2) return ddd ? `(${ddd}` : "";
  if (digitos.length <= 7) return `(${ddd}) ${inicio}`;
  return `(${ddd}) ${inicio}-${fim}`;
}

export function celularCompletoValido(valor: string) {
  return /^\d{2}9\d{8}$/.test(apenasDigitos(valor));
}

export function formatarCpf(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 11);
  const parte1 = digitos.slice(0, 3);
  const parte2 = digitos.slice(3, 6);
  const parte3 = digitos.slice(6, 9);
  const parte4 = digitos.slice(9, 11);

  if (digitos.length <= 3) return parte1;
  if (digitos.length <= 6) return `${parte1}.${parte2}`;
  if (digitos.length <= 9) return `${parte1}.${parte2}.${parte3}`;
  return `${parte1}.${parte2}.${parte3}-${parte4}`;
}

export function formatarCep(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 8);
  if (digitos.length <= 5) return digitos;
  return `${digitos.slice(0, 5)}-${digitos.slice(5, 8)}`;
}

export function formatarDataDigitada(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 8);
  const dia = digitos.slice(0, 2);
  const mes = digitos.slice(2, 4);
  const ano = digitos.slice(4, 8);

  if (digitos.length <= 2) return dia;
  if (digitos.length <= 4) return `${dia}/${mes}`;
  return `${dia}/${mes}/${ano}`;
}

export function dataBRParaISO(valor: string) {
  const [dia, mes, ano] = valor.split("/");
  if (!dia || !mes || !ano || ano.length !== 4) return "";
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

export function dataISOParaBR(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  if (!dia || !mes || !ano) return "";
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}
