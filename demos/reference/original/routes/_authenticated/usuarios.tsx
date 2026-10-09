import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Clock, Pencil, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AccessStatus, type AppRole } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  access_status: AccessStatus;
  created_at: string;
};

type UserAccessRow = ProfileRow & {
  role: AppRole;
};

const ACCESS_LABEL: Record<AccessStatus, string> = {
  pending: "Pendente",
  active: "Ativo",
  blocked: "Bloqueado",
};

export const Route = createFileRoute("/_authenticated/usuarios")({
  ssr: false,
  head: () => ({ meta: [{ title: "Acessos - Controle WhatsApp" }] }),
  component: UsersAccessPage,
});

function UsersAccessPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();

  const usersQ = useQuery({
    queryKey: ["user-access"],
    enabled: isAdmin,
    queryFn: async (): Promise<UserAccessRow[]> => {
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, access_status, created_at")
            .order("created_at", { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
        ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const roleByUser = new Map((roles ?? []).map((role) => [role.user_id, role.role as AppRole]));

      return (profiles ?? []).map((profile) => ({
        ...(profile as ProfileRow),
        role: roleByUser.get(profile.id) ?? "user",
      }));
    },
  });

  const updateAccessM = useMutation({
    mutationFn: async ({
      userId,
      status,
      role,
    }: {
      userId: string;
      status: AccessStatus;
      role?: AppRole;
    }) => {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          access_status: status,
          is_active: status !== "blocked",
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      if (status === "active" && role) {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role });
        if (insertError) throw insertError;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["user-access"] });
      toast.success("Acesso atualizado.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o acesso.");
    },
  });

  if (!isAdmin) {
    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Apenas administradores podem gerenciar usuários.
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const users = usersQ.data ?? [];
  const pendingUsers = users.filter((item) => item.access_status === "pending");
  const activeUsers = users.filter((item) => item.access_status === "active");
  const blockedUsers = users.filter((item) => item.access_status === "blocked");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <section className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Acessos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Aprove novos usuários, defina administradores e bloqueie acessos quando necessário.
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<Clock className="h-4 w-4" />}
            label="Pendentes"
            value={pendingUsers.length}
          />
          <SummaryCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Ativos"
            value={activeUsers.length}
          />
          <SummaryCard
            icon={<ShieldOff className="h-4 w-4" />}
            label="Bloqueados"
            value={blockedUsers.length}
          />
        </section>

        <UserSection
          title="Aguardando aprovação"
          users={pendingUsers}
          currentUserId={user?.id}
          loading={usersQ.isLoading}
          onApprove={(target, role) =>
            updateAccessM.mutate({ userId: target.id, status: "active", role })
          }
          onBlock={(target) => updateAccessM.mutate({ userId: target.id, status: "blocked" })}
          busy={updateAccessM.isPending}
        />

        <UserSection
          title="Usuários ativos"
          users={activeUsers}
          currentUserId={user?.id}
          loading={usersQ.isLoading}
          onApprove={(target, role) =>
            updateAccessM.mutate({ userId: target.id, status: "active", role })
          }
          onBlock={(target) => updateAccessM.mutate({ userId: target.id, status: "blocked" })}
          busy={updateAccessM.isPending}
        />

        <UserSection
          title="Bloqueados"
          users={blockedUsers}
          currentUserId={user?.id}
          loading={usersQ.isLoading}
          onApprove={(target, role) =>
            updateAccessM.mutate({ userId: target.id, status: "active", role })
          }
          onBlock={(target) => updateAccessM.mutate({ userId: target.id, status: "blocked" })}
          busy={updateAccessM.isPending}
        />
      </main>
    </>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">{icon}</div>
      </CardContent>
    </Card>
  );
}

function UserSection({
  title,
  users,
  currentUserId,
  loading,
  onApprove,
  onBlock,
  busy,
}: {
  title: string;
  users: UserAccessRow[];
  currentUserId?: string;
  loading: boolean;
  onApprove: (user: UserAccessRow, role: AppRole) => void;
  onBlock: (user: UserAccessRow) => void;
  busy: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant="secondary">{users.length}</Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Carregando usuários...
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhum usuário nesta lista.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((item) => (
            <UserAccessCard
              key={item.id}
              user={item}
              isCurrentUser={item.id === currentUserId}
              onApprove={onApprove}
              onBlock={onBlock}
              busy={busy}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function UserAccessCard({
  user,
  isCurrentUser,
  onApprove,
  onBlock,
  busy,
}: {
  user: UserAccessRow;
  isCurrentUser: boolean;
  onApprove: (user: UserAccessRow, role: AppRole) => void;
  onBlock: (user: UserAccessRow) => void;
  busy: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<AppRole>(user.role);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate font-medium">
              {user.full_name || user.email || "Usuário sem nome"}
            </div>
            {isCurrentUser && <Badge variant="outline">Você</Badge>}
            <AccessBadge status={user.access_status} />
            {user.role === "admin" && (
              <Badge className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            )}
            {user.role === "operator" && (
              <Badge variant="secondary" className="gap-1">
                <Pencil className="h-3 w-3" />
                Operador
              </Badge>
            )}
          </div>
          <div className="truncate text-sm text-muted-foreground">{user.email}</div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Visualizador</SelectItem>
              <SelectItem value="operator">Operador</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={busy} onClick={() => onApprove(user, selectedRole)}>
            {user.access_status === "active" ? "Salvar papel" : "Aprovar"}
          </Button>
          <Button
            variant="outline"
            disabled={busy || isCurrentUser || user.access_status === "blocked"}
            onClick={() => onBlock(user)}
          >
            Bloquear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessBadge({ status }: { status: AccessStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === "pending" && "bg-amber-100 text-amber-900",
        status === "active" && "bg-emerald-100 text-emerald-900",
        status === "blocked" && "bg-red-100 text-red-900",
      )}
    >
      {ACCESS_LABEL[status]}
    </Badge>
  );
}
