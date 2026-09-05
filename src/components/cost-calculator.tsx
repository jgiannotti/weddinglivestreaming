'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import costData from '@/lib/data/cost-by-state.generated.json';
import { US_STATES } from '@/lib/states';

// Estimate model. The base is real (a state's median published starting price,
// or the national median when a state has fewer than 2 priced vendors). The
// multipliers are editorial: they describe how the vendors in our dataset
// price cameras, coverage and add-ons relative to their base package. They are
// stated on the page in plain English so nobody mistakes them for measurements.
const CAMERA_MULT: Record<string, number> = { '1': 1, '2': 1.5, '3': 2.1 };
const COVERAGE_MULT: Record<string, number> = { ceremony: 1, ceremony_reception: 1.35, full_day: 1.8 };
const TRAVEL_ADD: Record<string, number> = { local: 0, regional: 125, far: 300 };
const HIGHLIGHT_ADD = 400;
const RECORDING_ADD = 75;

const fmt = (n: number) => `$${Math.round(n / 25) * 25}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const stateByCode = new Map(costData.states.map((s) => [s.code, s]));

export function CostCalculator() {
  const [state, setState] = useState<string>('');
  const [cameras, setCameras] = useState<string>('1');
  const [coverage, setCoverage] = useState<string>('ceremony');
  const [travel, setTravel] = useState<string>('local');
  const [recording, setRecording] = useState(true);
  const [highlight, setHighlight] = useState(false);

  const result = useMemo(() => {
    const row = state ? stateByCode.get(state) : undefined;
    const usable = row && row.vendorCount >= 2 ? row : undefined;
    const base = usable ? usable.medianStart : costData.national.medianStart;
    const point =
      base * CAMERA_MULT[cameras] * COVERAGE_MULT[coverage] +
      TRAVEL_ADD[travel] +
      (recording ? RECORDING_ADD : 0) +
      (highlight ? HIGHLIGHT_ADD : 0);
    return {
      low: point * 0.8,
      high: point * 1.3,
      point,
      base,
      baseLabel: usable
        ? `${usable.name} median starting price (${usable.vendorCount} vendors with published pricing)`
        : `national median starting price (${costData.sampleSize} vendors; ${
            row ? `${row.name} has only ${row.vendorCount} priced vendor` : 'no state selected'
          })`,
      slug: US_STATES.find((s) => s.abbreviation === state)?.slug,
      stateName: US_STATES.find((s) => s.abbreviation === state)?.name,
    };
  }, [state, cameras, coverage, travel, recording, highlight]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,380px)]">
      <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-6">
        <Field label="Where is the wedding?">
          <Select value={state} onValueChange={setState}>
            <SelectTrigger aria-label="State">
              <SelectValue placeholder="Choose a state (or leave blank for a national estimate)" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s.abbreviation} value={s.abbreviation}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="How many cameras?">
          <Choice
            value={cameras}
            onChange={setCameras}
            options={[
              ['1', '1 camera'],
              ['2', '2 cameras'],
              ['3', '3+ cameras (switched)'],
            ]}
          />
        </Field>

        <Field label="What should be covered?">
          <Choice
            value={coverage}
            onChange={setCoverage}
            options={[
              ['ceremony', 'Ceremony only'],
              ['ceremony_reception', 'Ceremony + toasts & first dance'],
              ['full_day', 'Full day'],
            ]}
          />
        </Field>

        <Field label="How far is the venue from the vendor?">
          <Choice
            value={travel}
            onChange={setTravel}
            options={[
              ['local', 'Under 30 miles'],
              ['regional', '30–75 miles'],
              ['far', '75+ miles'],
            ]}
          />
        </Field>

        <Field label="Add-ons">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recording}
                onChange={(e) => setRecording(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Downloadable recording
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={highlight}
                onChange={(e) => setHighlight(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Edited highlight video
            </label>
          </div>
        </Field>
      </div>

      <aside className="rounded-2xl border bg-accent/30 p-6 md:p-8 h-fit lg:sticky lg:top-24">
        <p className="eyebrow mb-2">Estimated cost</p>
        <p className="font-display text-4xl md:text-5xl font-medium" aria-live="polite">
          {fmt(result.low)}–{fmt(result.high)}
        </p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Built from the {result.baseLabel}, currently {fmt(result.base)}.
        </p>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Real quotes will vary with the vendor&rsquo;s experience, your date, and the venue&rsquo;s
          internet. Use this to set a budget, then compare two or three actual quotes.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={result.slug ? `/wedding-live-streaming-${result.slug}` : '/directory'}>
              {result.stateName ? `See ${result.stateName} vendors` : 'Browse vendors'}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guides/wedding-live-streaming-cost-by-state">See the data by state</Link>
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold mb-2">{label}</p>
      {children}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map(([v, label]) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={
              'rounded-full border px-4 py-2 text-sm transition-colors ' +
              (active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-transparent hover:bg-secondary/60')
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
