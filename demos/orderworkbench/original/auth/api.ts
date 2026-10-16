// Local-only boundary for the original interface. Never calls a production API.
import { parseOrder } from '../domain/parse-order';
import { createOrderPdf } from '../pdf/create-order-pdf';
import type { Order } from '../domain/types';

export async function api<T>(path: string, body: unknown): Promise<T> {
  if (path === '/api/tools/parse') {
    const text = (body as {text?:unknown}).text;
    if (typeof text !== 'string' || text.length > 10000 || text.split(/\r?\n/).length > 100) {
      throw new Error('Use até 100 linhas e 10.000 caracteres nesta demonstração.');
    }
    return parseOrder(text) as T;
  }
  if (path === '/api/tools/authorize-print') return {companyName:'Demonstração · Dados fictícios'} as T;
  throw new Error('Esta função não está disponível na demonstração.');
}

export async function apiResponse(path: string, body: unknown): Promise<Response> {
  if (path !== '/api/tools/export') throw new Error('Esta função não está disponível na demonstração.');
  const pdf = createOrderPdf(body as Order, new Date(), 'Demonstração · Dados fictícios');
  return new Response(pdf.output('arraybuffer'), {headers:{'Content-Type':'application/pdf'}});
}
