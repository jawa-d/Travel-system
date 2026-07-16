import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ error: "تغيير كلمة المرور غير متاح" }, { status: 403 });
}
