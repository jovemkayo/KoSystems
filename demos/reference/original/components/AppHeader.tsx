import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsFloatingButton } from "@/components/NotificationsFloatingButton";
import { ErpNavigation } from "@/modules/erp/Navigation";
import { toast } from "sonner";
export function AppHeader() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, role, isAdmin } = useAuth();
  const initials =
    (user?.user_metadata?.full_name as string | undefined)
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível encerrar a sessão. Tente novamente.");
      return;
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:p-3"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src="/reference-symbol.png"
              alt="Reference"
              className="h-9 w-9 object-contain"
            />
            <span className="hidden text-sm font-semibold sm:inline">Reference</span>
          </Link>
          <div className="hidden lg:block">
            <ErpNavigation admin={isAdmin} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2" aria-label="Minha conta">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="truncate text-sm font-medium">
                  {user?.user_metadata?.full_name || user?.email}
                </div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Acesso Números:{" "}
                  {role === "admin"
                    ? "Administrador"
                    : role === "operator"
                      ? "Operador"
                      : "Visualizador"}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/usuarios">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ErpNavigation mobile admin={isAdmin} />
      </div>
      <NotificationsFloatingButton />
    </>
  );
}
