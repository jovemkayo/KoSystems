type Row = Record<string, any> & {
  id?: string;
  current_employee_id?: string | null;
  carrier_id?: string | null;
  device_id?: string | null;
  phone_number_id?: string;
  from_employee_id?: string | null;
  to_employee_id?: string | null;
  performed_by?: string;
  status?: string;
  block_reason?: string | null;
  phone_number?: string;
  device_slot?: number | null;
  chip_capacity?: number;
};
type Result = { data: any; error: { message: string; code?: string } | null; count?: number };

// Implements the queries used by the original Reference screens, entirely in memory.
// Each iframe owns its database. There is deliberately no network client here.
export function createMemoryDatabase(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = structuredClone(seed);
  const photos = new Map<string, Blob>();
  const user = {
    id: "demo-admin",
    email: "visitante@example.invalid",
    user_metadata: { full_name: "Visitante demonstração" },
  };
  const session = { user };
  function relation(table: string, row: Row) {
    const find = (name: string, id: unknown) => tables[name]?.find((r) => r.id === id) ?? null;
    if (table === "phone_numbers")
      return {
        ...row,
        employees: find("employees", row.current_employee_id),
        prev: find("employees", row["previous_employee_id"]),
        carriers: find("carriers", row.carrier_id),
        devices: find("devices", row.device_id),
      };
    if (table === "phone_number_history")
      return {
        ...row,
        phone_numbers: find("phone_numbers", row.phone_number_id),
        from: find("employees", row.from_employee_id),
        to: find("employees", row.to_employee_id),
        by: find("profiles", row.performed_by),
      };
    return { ...row };
  }
  function history(before: Row | null, after: Row | null) {
    const event = !before
      ? "activated"
      : !after
        ? "deleted"
        : before.current_employee_id !== after.current_employee_id
          ? "transferred"
          : before.status !== after.status
            ? ({
                working: "unblocked",
                blocked: "blocked",
                deactivated: "deactivated",
                permanently_banned: "banned",
              }[after.status as string] ?? "status_changed")
            : null;
    if (!event) return;
    tables["phone_number_history"] ??= [];
    tables["phone_number_history"].push({
      id: crypto.randomUUID(),
      phone_number_id: (after ?? before)!.id!,
      event_type: event,
      from_status: before?.status ?? null,
      to_status: after?.status ?? null,
      from_employee_id: before?.current_employee_id ?? null,
      to_employee_id: after?.current_employee_id ?? null,
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      reason: after?.block_reason ?? null,
      observation: null,
    });
  }
  class Query implements PromiseLike<Result> {
    filters: ((r: Row) => boolean)[] = [];
    operation = "read";
    values: Row[] = [];
    sort: [string, boolean][] = [];
    max = Infinity;
    singular = false;
    optional = false;
    withCount = false;
    head = false;
    conflict: string | undefined;
    ignoreDuplicates = false;
    constructor(readonly table: string) {}
    select(_columns?: string, options?: { count?: string; head?: boolean }) {
      this.withCount = !!options?.count;
      this.head = !!options?.head;
      return this;
    }
    eq(key: string, value: unknown) {
      this.filters.push((r) => r[key] === value);
      return this;
    }
    neq(key: string, value: unknown) {
      this.filters.push((r) => r[key] !== value);
      return this;
    }
    is(key: string, value: unknown) {
      this.filters.push((r) => (r[key] ?? null) === value);
      return this;
    }
    in(key: string, values: unknown[]) {
      this.filters.push((r) => values.includes(r[key]));
      return this;
    }
    order(key: string, opts?: { ascending?: boolean }) {
      this.sort.push([key, opts?.ascending !== false]);
      return this;
    }
    limit(value: number) {
      this.max = value;
      return this;
    }
    single() {
      this.singular = true;
      return this;
    }
    maybeSingle() {
      this.singular = true;
      this.optional = true;
      return this;
    }
    insert(values: Row | Row[]) {
      this.operation = "insert";
      this.values = Array.isArray(values) ? values : [values];
      return this;
    }
    upsert(values: Row | Row[], options?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      this.insert(values);
      this.operation = "upsert";
      this.conflict = options?.onConflict;
      this.ignoreDuplicates = !!options?.ignoreDuplicates;
      return this;
    }
    update(values: Row) {
      this.operation = "update";
      this.values = [values];
      return this;
    }
    delete() {
      this.operation = "delete";
      return this;
    }
    execute(): Result {
      if (!(this.table in tables))
        return {
          data: null,
          error: { code: "42P01", message: "Módulo não provisionado na demonstração." },
        };
      if (this.table === "phone_number_stats")
        tables[this.table] = (tables["phone_numbers"] ?? []).map((phone) => {
          const events = (tables["phone_number_history"] ?? []).filter(
            (event) => event.phone_number_id === phone.id,
          );
          const count = (type: string) =>
            events.filter((event) => event["event_type"] === type).length;
          return {
            phone_number_id: phone.id!,
            block_count: count("blocked"),
            transfer_count: count("transferred"),
            activation_count: count("activated"),
            deactivation_count: count("deactivated"),
          };
        });
      const table = tables[this.table]!;
      let rows = table.filter((row) => this.filters.every((filter) => filter(row)));
      const writes: Row[] =
        this.operation === "insert" || this.operation === "upsert"
          ? this.values.map((v) => ({
              id: crypto.randomUUID(),
              created_at: new Date().toISOString(),
              ...structuredClone(v),
            }))
          : rows.map((r) => ({ ...r, ...this.values[0] }));
      if (
        this.table === "phone_numbers" &&
        this.operation !== "read" &&
        this.operation !== "delete"
      ) {
        for (const row of writes) {
          if (table.some((r) => r.id !== row.id && r.phone_number === row.phone_number))
            return { data: null, error: { message: "Número já cadastrado." } };
          const device = tables["devices"]?.find((d) => d.id === row.device_id);
          if (
            row.device_id &&
            row.device_slot &&
            (!device ||
              row.device_slot > (device.chip_capacity ?? 0) ||
              table.some(
                (r) =>
                  r.id !== row.id &&
                  r.device_id === row.device_id &&
                  r.device_slot === row.device_slot,
              ))
          )
            return {
              data: null,
              error: { message: "Este chip do dispositivo já está ocupado ou é inválido." },
            };
        }
      }
      if (this.operation === "insert" || this.operation === "upsert") {
        rows = [];
        for (const value of writes) {
          const existing =
            this.operation === "upsert"
              ? table.find((r) =>
                  (this.conflict ?? "id")
                    .split(",")
                    .every((key) => r[key.trim()] === value[key.trim()]),
                )
              : undefined;
          if (existing) {
            if (!this.ignoreDuplicates) Object.assign(existing, value, { id: existing.id });
          } else {
            table.push(value);
            if (this.table === "phone_numbers") history(null, value);
          }
          rows.push(existing ?? value);
        }
      } else if (this.operation === "update") {
        rows.forEach((r, i) => {
          const before = { ...r };
          Object.assign(r, writes[i]);
          if (this.table === "phone_numbers") {
            if (before.current_employee_id !== r.current_employee_id)
              r["previous_employee_id"] = before.current_employee_id ?? null;
            history(before, r);
          }
        });
      } else if (this.operation === "delete") {
        tables[this.table] = table.filter((r) => !rows.includes(r));
        if (this.table === "phone_numbers") rows.forEach((r) => history(r, null));
      }
      const count = rows.length;
      rows = rows.map((r) => relation(this.table, r));
      for (const [key, asc] of [...this.sort].reverse())
        rows.sort(
          (a, b) =>
            String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "pt-BR", { numeric: true }) *
            (asc ? 1 : -1),
        );
      rows = rows.slice(0, this.max);
      if (this.singular && rows.length !== 1 && !(this.optional && rows.length === 0))
        return { data: null, error: { message: "Registro não encontrado ou seleção ambígua." } };
      return {
        data: this.head ? null : this.singular ? (rows[0] ?? null) : rows,
        error: null,
        ...(this.withCount ? { count } : {}),
      };
    }
    then<TResult1 = Result, TResult2 = never>(
      success?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
      failure?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return Promise.resolve()
        .then(() => this.execute())
        .then(success, failure);
    }
  }
  return {
    from: (name: string) => new Query(name),
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => {
        location.reload();
        return { error: null };
      },
    },
    storage: {
      from: () => ({
        upload: async (path: string, file: Blob) => {
          photos.set(path, file);
          return { data: { path }, error: null };
        },
        remove: async (paths: string[]) => {
          paths.forEach((p) => photos.delete(p));
          return { error: null };
        },
        createSignedUrl: async (path: string) => ({
          data: { signedUrl: photos.has(path) ? URL.createObjectURL(photos.get(path)!) : "" },
          error: null,
        }),
      }),
    },
  };
}
