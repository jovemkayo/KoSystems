import { UserPlus } from "lucide-react";
import { Button } from "./ui/button";

type ClienteAvulsoCardProps = {
  nome: string;
  onCadastrar: (nome: string) => void;
};

export function ClienteAvulsoCard({ nome, onCadastrar }: ClienteAvulsoCardProps) {
  return (
    <li className="rounded-lg border border-border p-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{nome}</p>
          <p className="text-sm text-muted-foreground">Cliente avulso</p>
          <p className="text-xs text-muted-foreground">Informado diretamente na venda</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onCadastrar(nome)}>
          <UserPlus className="size-4" />
          Cadastrar
        </Button>
      </div>
    </li>
  );
}
