import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { directAccessUser } from "@/lib/direct-access";
import { prisma } from "@/lib/prisma";

const imageSchema = z.object({
  image: z.string().max(100_000).nullable().optional()
});

export async function PATCH(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (user.id === directAccessUser.id) {
    return NextResponse.json({ error: "لا يمكن تعديل صورة وضع العرض" }, { status: 400 });
  }

  try {
    const data = imageSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { image: data.image || null },
      select: { image: true }
    });
    return NextResponse.json({ image: updated.image });
  } catch (error) {
    console.error("[profile] Failed to update profile image", { userId: user.id, error });
    return NextResponse.json({ error: "تعذر حفظ صورة الحساب" }, { status: 400 });
  }
}
