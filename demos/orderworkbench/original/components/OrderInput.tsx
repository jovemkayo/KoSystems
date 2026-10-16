interface Props {
  text: string;
  customer: string;
  reading: boolean;
  error: string;
  onText: (value: string) => void;
  onCustomer: (value: string) => void;
  onParse: () => void;
  onPdf: (file: File) => void;
  onCancel: () => void;
}
export function OrderInput({
  text,
  customer,
  reading,
  error,
  onText,
  onCustomer,
  onParse,
  onPdf,
  onCancel,
}: Props) {
  return (
    <section className="panel input-panel" aria-labelledby="input-title">
      <div className="panel-heading">
        <div>
          <h2 id="input-title">Comece pelo pedido</h2>
          <p>Cole o texto ou selecione um PDF.</p>
        </div>
      </div>
      <label htmlFor="customer">Cliente</label>
      <input
        id="customer"
        className="customer-input"
        value={customer}
        onChange={(e) => onCustomer(e.target.value)}
        placeholder="Nome do cliente"
        aria-invalid={customer.trim().length > 120}
      />
      {customer.trim().length > 120 && (
        <p className="field-error">Cliente deve ter até 120 caracteres.</p>
      )}
      <label htmlFor="order-text">Texto do pedido</label>
      <textarea
        id="order-text"
        value={text}
        onChange={(e) => onText(e.target.value)}
        spellCheck={false}
        placeholder="Cole o texto do pedido"
      />
      <button className="button primary full" onClick={onParse}>
        Interpretar pedido
      </button>
      <label className="file-button" htmlFor="pdf-file">
        Ler PDF
      </label>
      <input
        className="sr-only"
        id="pdf-file"
        aria-label="Ler PDF"
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPdf(file);
        }}
      />
      {reading && (
        <div className="reading-status" role="status">
          Lendo PDF… <button onClick={onCancel}>Cancelar leitura</button>
        </div>
      )}
      {error && (
        <p className="error-banner" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
