"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LookupSelect({
  label,
  name,
  category,
  initialOptions,
  required = false,
  canAdd = true
}: {
  label: string;
  name: string;
  category: string;
  initialOptions: { value: string; label: string }[];
  required?: boolean;
  canAdd?: boolean;
}) {
  const [options, setOptions] = useState(initialOptions);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(initialOptions[0]?.value ?? "");
  const [error, setError] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  async function add() {
    setError("");
    const labelAr = newLabel.trim();
    const value = (newValue.trim() || labelAr).trim();
    if (!labelAr) return setError("اسم القيمة مطلوب");
    const response = await fetch("/api/lookups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value, labelAr, labelEn: "", sortOrder: options.length * 10 + 10 })
    });
    const result = await response.json();
    if (!response.ok) return setError(result.error ?? "تعذر إضافة القيمة");
    const option = { value: result.value, label: result.labelAr };
    setOptions((current) => [...current, option]);
    setSelected(option.value);
    setAdding(false);
    setNewLabel("");
    setNewValue("");
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`lookup-${name}`}>{label}</Label>
      <div className="flex gap-2">
        <select id={`lookup-${name}`} name={name} value={selected} onChange={(event) => setSelected(event.target.value)} required={required} className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {canAdd ? <Button type="button" size="icon" variant="outline" onClick={() => setAdding((value) => !value)} aria-label="إضافة قيمة جديدة">
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button> : null}
      </div>
      {adding ? (
        <div className="grid gap-2 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[1fr_150px_auto]">
          <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="اسم القيمة الجديدة" />
          <Input value={newValue} onChange={(event) => setNewValue(event.target.value)} placeholder="VALUE_CODE" dir="ltr" />
          <Button type="button" size="sm" onClick={add}>حفظ</Button>
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
