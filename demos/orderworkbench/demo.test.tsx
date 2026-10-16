// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from './original/App';
import {api, apiResponse} from './original/auth/api';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('interpreta e edita um pedido na tela original, sem login ou acesso ao servidor', async () => {
  const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network in demo'));
  render(<App />);
  fireEvent.change(screen.getByLabelText('Texto do pedido'), {target:{value:'Cliente: Exemplo fictício\n2 kg de tomate\n3 un de alface'}});
  fireEvent.click(screen.getByRole('button', {name:'Interpretar pedido'}));
  await waitFor(() => expect(screen.getByDisplayValue('TOMATE')).toBeTruthy());
  fireEvent.change(screen.getByLabelText('Cliente', {selector:'input'}), {target:{value:'Cliente fictício B'}});
  expect(screen.getByDisplayValue('Cliente fictício B')).toBeTruthy();
  expect(screen.getByRole('button', {name:'Imprimir pedido'}).hasAttribute('disabled')).toBe(false);
  expect(network).not.toHaveBeenCalled();
  expect(screen.queryByText(/entrar|assinatura/i)).toBeNull();
});

it('gera o PDF local e não permite rotas de conta ou assinatura', async () => {
  const network = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('No network in demo'));
  const result = await api<{items:unknown[];customer:string}>('/api/tools/parse', {text:'Cliente: Exemplo\n2 kg de tomate'});
  const response = await apiResponse('/api/tools/export', {...result,stage:'administrativo'});
  expect(response.headers.get('Content-Type')).toBe('application/pdf');
  expect(new TextDecoder().decode(new Uint8Array(await response.arrayBuffer()).subarray(0,5))).toBe('%PDF-');
  await expect(api('/api/billing', {})).rejects.toThrow('não está disponível');
  await expect(api('/api/tools/parse', {text:'a'.repeat(10001)})).rejects.toThrow('10.000 caracteres');
  expect(network).not.toHaveBeenCalled();
});
