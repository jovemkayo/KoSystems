import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const csp =
  "default-src 'none'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'none'; worker-src 'self' blob: https://cdnjs.cloudflare.com; frame-src 'self'; base-uri 'none'; form-action 'none'";
const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="${csp}">`;
const html = (kind) =>
  `<!doctype html><html lang="pt-BR"><head>${head}<title>Demonstração</title>${kind === "lavandine" ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=DM+Sans:wght@400;500;600&display=swap">' : ""}</head><body><div id="root"></div><script type="module" src="./main.tsx"></script></body></html>`;

for (const kind of ["lavandine"]) {
  const demoRoot = resolve(root, "demos", kind);
  const routes =
    kind === "lavandine"
      ? ["index", "compras", "estoque", "producao", "produtos", "clientes", "vendas", "relatorios"]
      : [
          "dashboard",
          "numeros.index",
          "numeros.$id",
          "dispositivos",
          "funcionarias.index",
          "funcionarias.$id",
          "historico",
          "entrada",
          "usuarios",
        ];
  let entry = `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {createRootRoute,createRoute,createRouter,createHashHistory,Outlet,RouterProvider,redirect} from '@tanstack/react-router';
    import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
    import {Toaster} from './original/components/ui/sonner'; import './original/styles.css';
    const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});`;
  if (kind === "lavandine")
    entry += `import {AuthProvider} from './original/lib/auth'; import {StoreProvider} from './original/lib/store';`;
  for (const [i, route] of routes.entries())
    entry += `\nimport {Route as route${i}} from './original/routes/${kind === "reference" ? "_authenticated/" : ""}${route}';`;
  if (kind === "reference")
    entry +=
      "\nimport {Route as authenticatedRoute} from './original/routes/_authenticated/route';";
  entry += `\nconst rootRoute=createRootRoute({component:()=> <QueryClientProvider client={queryClient}>${kind === "lavandine" ? "<AuthProvider><StoreProvider>" : ""}<Outlet/><Toaster position="top-center"/>${kind === "lavandine" ? "</StoreProvider></AuthProvider>" : ""}</QueryClientProvider>});`;
  if (kind === "reference")
    entry +=
      "\nconst authenticated=authenticatedRoute.update({id:'_authenticated',getParentRoute:()=>rootRoute});";
  for (const [i, route] of routes.entries()) {
    const path = route === "index" ? "/" : `/${route.replace(/\.index$/, "/").replace(/\./g, "/")}`;
    entry += `\nconst page${i}=route${i}.update({id:'${path}',path:'${path}',getParentRoute:()=>${kind === "reference" ? "authenticated" : "rootRoute"}});`;
  }
  if (kind === "reference")
    entry +=
      "\nconst landing=createRoute({getParentRoute:()=>rootRoute,path:'/',beforeLoad:()=>{throw redirect({to:'/dashboard'})}}); const legacy=createRoute({getParentRoute:()=>rootRoute,path:'/gestao',beforeLoad:()=>{throw redirect({to:'/dashboard'})}}); const oldDemo=createRoute({getParentRoute:()=>rootRoute,path:'/demonstracao',beforeLoad:()=>{throw redirect({to:'/dashboard'})}});";
  const pages = routes.map((_, i) => `page${i}`).join(",");
  entry += `\nconst routeTree=rootRoute.addChildren([${kind === "reference" ? `landing,legacy,oldDemo,authenticated.addChildren([${pages}])` : pages}]);
    const router=createRouter({routeTree,history:createHashHistory(),context:{queryClient}});
    createRoot(document.getElementById('root')!).render(<RouterProvider router={router}/>);`;
  await writeFile(resolve(demoRoot, "index.html"), html(kind));
  await writeFile(resolve(demoRoot, "main.tsx"), entry);
  await build({
    configFile: false,
    root: demoRoot,
    envDir: false,
    base: `/demos/${kind}/`,
    publicDir: resolve(demoRoot, "public"),
    resolve: { alias: { "@": resolve(demoRoot, "original") }, dedupe: ["react", "react-dom"] },
    plugins: [
      {
        name: "demo-environment",
        enforce: "pre",
        transform(code, id) {
          if (!id.replaceAll("\\", "/").startsWith(demoRoot.replaceAll("\\", "/"))) return;
          if (id.endsWith("styles.css")) return code.replace('@source "../src";', '@source ".";');
          if (/\.[jt]sx?$/.test(id))
            return code
              .replaceAll('"/assets/', `"/demos/${kind}/assets/`)
              .replaceAll('"/reference-', '"/demos/reference/reference-');
        },
      },
      react(),
      tailwind(),
    ],
    build: { outDir: resolve(root, "public/demos", kind), emptyOutDir: true, sourcemap: false },
  });
}

const orderRoot = resolve(root, "demos/orderworkbench");
await build({
  configFile: false,
  root: orderRoot,
  envDir: false,
  base: "/demos/orderworkbench/",
  publicDir: resolve(orderRoot, "public"),
  plugins: [react()],
  build: {
    outDir: resolve(root, "public/demos/orderworkbench"),
    emptyOutDir: true,
    sourcemap: false,
  },
});
for (const folder of ["standard_fonts", "cmaps", "wasm"]) {
  await cp(
    resolve(root, "node_modules/pdfjs-dist", folder),
    resolve(root, "public/demos/orderworkbench/pdf-assets", folder),
    { recursive: true },
  );
}

for (const kind of ["estalagem"]) {
  const src = resolve(root, "demos", kind);
  const dst = resolve(root, "public/demos", kind);
  await mkdir(dst, { recursive: true });
  for (const file of kind === "estalagem"
    ? ["assets"]
    : ["styles.css", "app.js", "catalogo-produtos.js"])
    await cp(resolve(src, file), resolve(dst, file), { recursive: true });
  if (kind === "estalagem") {
    let app = await readFile(resolve(dst, "assets/js/app.js"), "utf8");
    app = app
      .replace(
        /image\.src = `https:\/\/api\.qrserver\.com[^;]+;/g,
        'image.src = "./assets/img/pix-demonstrativo.svg";',
      )
      .replace(
        'const key = String(state.pixKey || "").trim();',
        'return "PIX-DEMONSTRATIVO-SEM-VALOR-PARA-PAGAMENTO";\n    const key = String(state.pixKey || "").trim();',
      )
      .replaceAll("localStorage", "window.demoStorage")
      .replaceAll("sessionStorage", "window.demoStorage")
      .replace('if ("serviceWorker" in navigator)', "if (false)")
      .replace(
        "let state = loadState();",
        `initialState.orders = [{ id: "demo-order1", command: 1, status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [{id:"demo-item1",name:"Refeição por peso",price:25,quantity:1}] }];\n  let state = loadState();`,
      )
      .replace(
        'if (!supabaseClient) throw new Error("Supabase indisponivel.");',
        'return { status: "approved", authorizationCode: "DEMO", transactionId: "demo-payment" };',
      );
    await writeFile(resolve(dst, "assets/js/app.js"), app);
  }
  let index = await readFile(resolve(src, "index.html"), "utf8");
  index = index
    .replace(/<head>/, `<head>${head}`)
    .replace(/\s*<link rel="manifest"[^>]+>/g, "")
    .replace(
      /\s*<script src="(?:https:[^"]*supabase[^\"]*|\.\/assets\/js\/supabase-config.js)"><\/script>/g,
      "",
    );
  index = index.replace(
    /(<script src="\.\/(?:assets\/js\/app|app)\.js"><\/script>)/,
    '<script src="./demo-environment.js"></script>$1',
  );
  await writeFile(resolve(dst, "index.html"), index);
  await cp(resolve(src, "demo-environment.js"), resolve(dst, "demo-environment.js"));
}
console.log("Three original frontend demonstrations built without production credentials.");
