export interface PdfTextItem {
  str: string;
  transform: number[];
  hasEOL?: boolean;
  width?: number;
}
const normalized=(value:string)=>value.normalize('NFD').replace(/\p{M}/gu,'').trim().toUpperCase();
interface Row {y:number;parts:{x:number;text:string;width:number}[]}
type Column='product'|'quantity'|'unit'|'note'|'ignore';
function tableText(rows:Row[]):string|null {
  const headerIndex=rows.findIndex(row=>row.parts.some(p=>normalized(p.text)==='PRODUTO')&&row.parts.some(p=>/^(?:QUANTIDADE|QUANT\.?|QTD\.?)$/.test(normalized(p.text)))&&row.parts.some(p=>/^(?:PRECO|VALOR)/.test(normalized(p.text))));
  if(headerIndex<0)return null;
  const header=rows[headerIndex]!;
  if(header.parts.some(p=>p.width<=0))return null;
  const columns=header.parts.map(p=>{
    const name=normalized(p.text);
    const kind:Column=name==='PRODUTO'?'product':/^(?:QUANTIDADE|QUANT\.?|QTD\.?)$/.test(name)?'quantity':/^(?:UND|UNIDADE)$/.test(name)?'unit':/^(?:OBS|OBSERVACAO|PADRAO)/.test(name)?'note':'ignore';
    return {center:p.x+p.width/2,kind};
  });
  const title=rows.slice(0,headerIndex).flatMap(row=>row.parts).find(p=>! /^(?:BOLETO|DATA\b|ENTREGAR\b|HORARIO\b|ENDERECO\b|RUA\b|AVENIDA\b|CNPJ\b|NAO EMITIR\b)/.test(normalized(p.text)));
  const customer=title?.text.replace(/\s+CNPJ\b.*$/iu,'').replace(/^(?:CLIENTE|NOME)\s*[:\-]\s*/iu,'').trim();
  const lines=[...(customer?[`Cliente: ${customer}`]:[]),'Produto\tQuantidade\tUnidade\tObservação'];
  for(const row of rows.slice(headerIndex+1)) {
    const raw=row.parts.map(p=>p.text).join(' ');
    if(!raw||/^(?:R\$\s*[\d.,]+|TOTAL\s*:?\s*(?:R\$)?\s*[\d.,]+)$/iu.test(raw)||/^CLIENTE POR COTA[CÇ][AÃ]O\b/iu.test(raw))continue;
    const values={product:[] as string[],quantity:[] as string[],unit:[] as string[],note:[] as string[],ignore:[] as string[]};
    for(const part of row.parts) {
      const center=part.x+part.width/2;
      const index=columns.findIndex((column,i)=>i===columns.length-1||center<(column.center+columns[i+1]!.center)/2);
      values[columns[index]!.kind].push(part.text.replace(/\s+/gu,' '));
    }
    if(values.product.length)lines.push([values.product.join(' '),values.quantity.join(' '),values.unit.join(' '),values.note.join('; ')].join('\t'));
    else if(values.quantity.length||values.unit.length||values.note.length)lines.push(raw);
  }
  return lines.join('\n');
}
export function groupPdfText(items: PdfTextItem[]): string {
  const rows: Row[] = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = item.transform[5] ?? 0,
      x = item.transform[4] ?? 0;
    let row = rows.find((candidate) => Math.abs(candidate.y - y) < 4);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, text: item.str.trim(),width:item.width??0 });
  }
  rows.sort((a,b)=>b.y-a.y);for(const row of rows)row.parts.sort((a,b)=>a.x-b.x);
  const table=tableText(rows);if(table!==null)return table;
  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.text)
        .join(" "),
    )
    .join("\n");
}
