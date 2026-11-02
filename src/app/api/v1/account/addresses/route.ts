import type { NextRequest } from "next/server";
import { requireUser } from "@/auth/current-user";
import { addressSchema } from "@/customers/schemas";
import { serializeAddress } from "@/customers/serialize";
import { createAddress, listAddresses } from "@/customers/service";
import { ok, readJson, runApi } from "@/lib/http";

export async function GET(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    return ok({ addresses: (await listAddresses(user._id)).map(serializeAddress) });
  });
}

export async function POST(req: NextRequest) {
  return runApi(req, async () => {
    const { user } = await requireUser(req);
    const input = addressSchema.parse(await readJson(req));
    return ok({ address: serializeAddress(await createAddress(user._id, input)) }, 201);
  });
}
