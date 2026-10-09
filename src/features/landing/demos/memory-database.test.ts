import { describe, it, expect } from "vitest";
import { createMemoryDatabase } from "../../../../demos/shared/memory-database";

const seed = {
  employees: [
    { id: "a", name: "Exemplo A" },
    { id: "b", name: "Exemplo B" },
  ],
  devices: [{ id: "d", name: "Aparelho exemplo", chip_capacity: 2 }],
  carriers: [],
  profiles: [],
  phone_number_history: [],
  phone_number_stats: [],
  phone_numbers: [
    {
      id: "p",
      phone_number: "11000000001",
      current_employee_id: "a",
      device_id: "d",
      device_slot: 1,
      status: "working",
    },
  ],
};

describe("isolated original-project data adapter", () => {
  it("keeps distinct notifications with compound conflicts and updates existing ones", async () => {
    const db = createMemoryDatabase({ notifications: [] });
    await db.from("notifications").upsert(
      [
        { type: "restriction_expired", phone_number_id: "p1", read: false },
        { type: "restriction_expired", phone_number_id: "p2", read: false },
      ],
      { onConflict: "type,phone_number_id" },
    );
    await db
      .from("notifications")
      .upsert(
        { type: "restriction_expired", phone_number_id: "p1", read: true },
        { onConflict: "type,phone_number_id" },
      );
    await db
      .from("notifications")
      .upsert(
        { type: "restriction_expired", phone_number_id: "p1", read: false },
        { onConflict: "type,phone_number_id", ignoreDuplicates: true },
      );
    const result = await db.from("notifications").select();
    expect(result.data).toHaveLength(2);
    expect(
      result.data.find((row: { phone_number_id: string }) => row.phone_number_id === "p1").read,
    ).toBe(true);
    expect(
      result.data.find((row: { phone_number_id: string }) => row.phone_number_id === "p2").read,
    ).toBe(false);
  });
  it("changes the responsible employee and creates the history consumed by the real screens", async () => {
    const db = createMemoryDatabase(seed);
    expect(
      (await db.from("phone_numbers").update({ current_employee_id: "b" }).eq("id", "p")).error,
    ).toBeNull();
    const phone = await db.from("phone_numbers").select().eq("id", "p").single();
    expect(phone.data.employees.name).toBe("Exemplo B");
    expect(phone.data.prev.name).toBe("Exemplo A");
    expect(
      (await db.from("phone_number_stats").select().eq("phone_number_id", "p").single()).data
        .transfer_count,
    ).toBe(1);
    const history = await db.from("phone_number_history").select();
    expect(history.data[0]).toMatchObject({
      event_type: "transferred",
      from: { name: "Exemplo A" },
      to: { name: "Exemplo B" },
    });
  });
  it("rejects duplicate phone numbers and occupied device slots without corrupting the data", async () => {
    const db = createMemoryDatabase(seed);
    expect(
      (await db.from("phone_numbers").insert({ phone_number: "11000000001" })).error,
    ).not.toBeNull();
    expect(
      (
        await db
          .from("phone_numbers")
          .insert({ phone_number: "11000000002", device_id: "d", device_slot: 1 })
      ).error,
    ).not.toBeNull();
    expect((await db.from("phone_numbers").select()).data).toHaveLength(1);
  });
  it("isolates each visitor and never mutates the seed", async () => {
    const first = createMemoryDatabase(seed),
      second = createMemoryDatabase(seed);
    await first.from("phone_numbers").delete().eq("id", "p");
    expect((await first.from("phone_numbers").select()).data).toHaveLength(0);
    expect((await second.from("phone_numbers").select()).data).toHaveLength(1);
    expect(seed.phone_numbers).toHaveLength(1);
  });
  it("returns errors for missing tables and missing required single records", async () => {
    const db = createMemoryDatabase(seed);
    expect((await db.from("production_database").select()).error?.code).toBe("42P01");
    expect(
      (await db.from("phone_numbers").select().eq("id", "missing").single()).error,
    ).not.toBeNull();
    expect(
      (await db.from("phone_numbers").select().eq("id", "missing").maybeSingle()).data,
    ).toBeNull();
  });
});
