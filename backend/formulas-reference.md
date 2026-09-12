# Renewable Energy Intelligence — Formula Reference

Each formula: definition → numerical worked example → sample output → technical interpretation → cross-check against the project report (ExProjectians.pdf) → variable mapping into the risk/scoring system.

---

## 1. Solar Expected Power

**Formula**
```
expected_power_kW = rated_capacity_kW × (GTI / 1000) × η_system × η_temp
```

**Numerical example**
- `rated_capacity_kW` = 5 kW
- `GTI` (Global Tilted Irradiance, from Open-Meteo) = 750 W/m²
- `η_system` = 0.80
- `η_temp` = 0.94 (from Formula 2 below)

```
expected_power_kW = 5 × (750/1000) × 0.80 × 0.94
                   = 5 × 0.75 × 0.80 × 0.94
                   = 2.82 kW
```

**Sample output**
```json
{ "asset_id": "SP-101", "expected_power_kW": 2.82, "timestamp": "2026-09-12T13:00:00Z" }
```

**Interpretation**
Under current sunlight and temperature conditions, SP-101 should be producing ~2.82 kW. This is the *baseline* — not a measurement, a physics-derived prediction independent of the panel's own sensors.

**PDF cross-check**
Matches Section 7 ("irradiance" as a solar input) and Section 11's `power_deviation_from_expected` feature — this formula is what *generates* the "expected" side of that feature, which the PDF lists but does not itself define numerically.

**Variable mapping**
`expected_power_kW` → feeds directly into **Formula 3 (Deviation %)** → feeds into **Risk Score's "performance loss" term** (Section 12).

---

## 2. Temperature Derating Factor (η_temp)

**Formula**
```
cell_temp = ambient_temp + (NOCT − 20) × (GTI / 800)
η_temp = 1 − γ × (cell_temp − 25)
```

**Numerical example**
- `ambient_temp` = 32°C
- `NOCT` = 45°C (typical panel spec)
- `GTI` = 750 W/m²
- `γ` = 0.004 (0.4%/°C)

```
cell_temp = 32 + (45 − 20) × (750/800)
          = 32 + 25 × 0.9375
          = 32 + 23.4
          = 55.4°C

η_temp = 1 − 0.004 × (55.4 − 25)
       = 1 − 0.004 × 30.4
       = 1 − 0.1216
       = 0.878 (≈ 0.88, not 0.94 — corrected below)
```
*(Note: the 0.94 used in Formula 1's example was illustrative; a hot 32°C day realistically derates closer to 0.88. Use whichever your simulator's ambient_temp input produces.)*

**Sample output**
```json
{ "cell_temp_C": 55.4, "eta_temp": 0.878 }
```

**Interpretation**
The panel's actual operating temperature (55.4°C) is well above its 25°C rating point, cutting efficiency by ~12%. This is a *normal, weather-driven* efficiency loss — not a fault.

**PDF cross-check**
Directly supports the PDF's core design principle (Section 5): "an anomaly is not automatically treated as a confirmed failure" — this formula is precisely what prevents a hot-day efficiency dip from being misclassified as degradation.

**Variable mapping**
`eta_temp` → multiplies into `expected_power_kW` (Formula 1). Not scored on its own — it's a correction term, not a signal.

---

## 3. Solar Deviation %

**Formula**
```
deviation_% = (expected_power_kW − actual_power_kW) / expected_power_kW × 100
```

**Numerical example**
- `expected_power_kW` = 2.82
- `actual_power_kW` = 2.15 (from simulated/measured sensor)

```
deviation_% = (2.82 − 2.15) / 2.82 × 100
            = 0.67 / 2.82 × 100
            = 23.8%
```

**Sample output**
```json
{ "asset_id": "SP-101", "expected_kW": 2.82, "actual_kW": 2.15, "deviation_pct": 23.8 }
```

**Interpretation**
SP-101 is underperforming its weather-adjusted expectation by ~24%. This is a meaningful gap — worth checking persistence (Formula 8) before flagging, since a single reading could be transient (e.g. a passing cloud not captured by hourly irradiance data).

**PDF cross-check**
This *is* the `power_deviation_from_expected` feature named explicitly in Section 11's feature list. Also underlies the Section 10 solar soiling example ("power output gradually decreases... normal irradiance").

**Variable mapping**
`deviation_pct` → primary input to **Risk Score's "performance loss" term (25% weight, Section 12)** and to the PyTorch anomaly model's feature vector.

---

## 4. Wind Expected Power (Physics-Based)

**Formula**
```
expected_power_kW = 0.5 × ρ × A × v³ × Cp × η_gen / 1000
(capped: 0 below cut-in, flat at rated above rated speed, 0 above cut-out)
```

**Numerical example**
- `ρ` = 1.225 kg/m³ (sea-level standard)
- Rotor radius `r` = 40 m → `A = π × 40² = 5026.5 m²`
- `v` (wind speed at hub height, Open-Meteo) = 9 m/s
- `Cp` = 0.40
- `η_gen` = 0.90

```
expected_power_kW = 0.5 × 1.225 × 5026.5 × 9³ × 0.40 × 0.90 / 1000
                   = 0.5 × 1.225 × 5026.5 × 729 × 0.40 × 0.90 / 1000
                   = 0.6125 × 5026.5 × 729 × 0.36 / 1000
                   = 3,078.7 × 729 × 0.36 / 1000
                   = 2,244,373 × 0.36 / 1000
                   ≈ 807.97 kW
```
*(Assume turbine rated capacity = 800 kW → apply cap: `expected_power_kW = min(807.97, 800) = 800 kW`)*

**Sample output**
```json
{ "asset_id": "WT-07", "wind_speed_ms": 9, "expected_power_kW": 800, "capped": true }
```

**Interpretation**
At 9 m/s, the physics formula suggests the turbine could theoretically generate slightly above its rated capacity — the control system caps it at 800 kW (rated). This is expected, correct turbine behavior, not a fault.

**PDF cross-check**
Matches Section 9's WT-07 example directly: "Power output: Expected near expected for wind speed" — this formula computes that exact "expected for wind speed" value the example refers to qualitatively.

**Variable mapping**
`expected_power_kW` → feeds into wind's own **Deviation %** (same formula as #3, applied to wind) → feeds Risk Score's performance-loss term for wind assets.

---

## 5. Cut-in / Rated / Cut-out Limits

**Formula**
```
if v < 3 m/s:              expected_power = 0
if v > rated_wind_speed:   expected_power = rated_capacity_kW
if v > 25 m/s:              expected_power = 0
```

**Numerical example**
- Case A: `v = 2 m/s` → below cut-in → `expected_power = 0 kW`
- Case B: `v = 27 m/s` → above cut-out (25 m/s) → `expected_power = 0 kW` (safety shutdown)

**Sample output**
```json
[
  { "wind_speed_ms": 2, "expected_power_kW": 0, "state": "below_cut_in" },
  { "wind_speed_ms": 27, "expected_power_kW": 0, "state": "cut_out_shutdown" }
]
```

**Interpretation**
Both cases show zero expected power for entirely different, both-normal reasons — too little wind to turn the rotor, or too much wind, triggering a safety shutdown. Neither should ever be flagged as a fault; actual power near 0 in these conditions is correct operation.

**PDF cross-check**
Reinforces Section 5's principle: without this rule, a turbine correctly shut down in a storm (actual power = 0) compared against a naive expected-power formula (which would predict very high power at 27 m/s if uncapped) would generate a false Critical alert — exactly the kind of false positive the PDF's "combined evidence, not single-signal" philosophy warns against.

**Variable mapping**
Acts as a **gate/override** on Formula 4's output before deviation is calculated — prevents `deviation_pct` from being computed against a physically invalid expected value.

---

## 6. Air Density Correction

**Formula**
```
ρ = P / (R × T)
```

**Numerical example**
- `P` (surface pressure, Open-Meteo) = 95,000 Pa (site at moderate elevation)
- `R` = 287.05 J/(kg·K)
- `T` = 28°C + 273.15 = 301.15 K

```
ρ = 95000 / (287.05 × 301.15)
  = 95000 / 86,443.4
  = 1.099 kg/m³
```

**Sample output**
```json
{ "pressure_Pa": 95000, "temp_K": 301.15, "air_density_kg_m3": 1.099 }
```

**Interpretation**
This site's actual air density (1.099) is ~10% lower than the sea-level standard (1.225) due to elevation/heat — meaning the same wind speed carries ~10% less energy here than the standard constant would assume. Using the constant would overestimate expected power at this site.

**PDF cross-check**
Not explicitly named in the PDF, but supports the general accuracy goal of Section 13 (loss estimation) — an inflated expected-power baseline would overstate the revenue-loss-if-ignored figure, undermining the credibility of that number for evaluators.

**Variable mapping**
`ρ` → substitutes into Formula 4 in place of the 1.225 constant when precision matters (e.g. non-sea-level sites).

---

## 7. Soiling Derate (Solar)

**Formula**
```
soiling_derate = 1 − min(soiling_accumulation_rate × k, max_soiling_loss)
soiled_expected_power_kW = expected_power_kW × soiling_derate
```

**Numerical example**
- `soiling_accumulation_rate` = 12 (cumulative PM10-days proxy since last clean)
- `k` = 0.01
- `max_soiling_loss` = 0.18 (18% cap)

```
soiling_derate = 1 − min(12 × 0.01, 0.18)
               = 1 − min(0.12, 0.18)
               = 1 − 0.12
               = 0.88

soiled_expected_power_kW = 2.82 × 0.88 = 2.48 kW
```

**Sample output**
```json
{ "asset_id": "SP-101", "clean_expected_kW": 2.82, "soiled_expected_kW": 2.48, "soiling_derate": 0.88 }
```

**Interpretation**
Given accumulated dust, ~12% of the drop from clean-expected output is explained by soiling alone — not a mechanical/electrical fault. Compare actual (2.15 kW from Formula 3) against *soiled-expected* (2.48 kW), not clean-expected: `(2.48-2.15)/2.48 = 13.3%` remaining deviation is the *unexplained* gap, a smaller and more accurate anomaly signal than the raw 23.8%.

**PDF cross-check**
Directly implements Section 10's example ("power output gradually decreases while soiling sensor increases... classify as probable soiling... recommended action: cleaning") — this formula is the missing numerical mechanism behind that qualitative example.

**Variable mapping**
`soiling_derate` → refines Formula 3's deviation calc → routes output toward **"probable soiling" (low severity)** vs **"mechanical/electrical fault" (higher severity)** in the risk engine's asset-specific logic (Section 5, Section 12).

---

## 8. Persistence

**Formula**
```
persistence_score = (number of consecutive windows where |deviation_pct| > threshold) / total_windows_checked
```

**Numerical example**
- Threshold = 15%
- Last 5 readings' deviation%: `[22%, 24%, 19%, 8%, 21%]`
- Windows exceeding threshold: 4 out of 5

```
persistence_score = 4/5 = 0.80
```

**Sample output**
```json
{ "asset_id": "SP-101", "persistence_score": 0.80, "windows_checked": 5 }
```

**Interpretation**
The deviation is sustained (80% of recent windows), not a one-off blip — this substantially raises confidence that something is actually wrong, versus a single noisy reading.

**PDF cross-check**
Matches Section 5 explicitly: "the model looks at... whether the abnormal pattern persists" and Section 12's Risk Score formula, which names "persistence" as an explicit 20%-weighted term.

**Variable mapping**
`persistence_score` → direct input to **Risk Score (20% weight, Section 12)**.

---

## 9. Risk Score (from PDF Section 12, with worked numbers)

**Formula (from report)**
```
Risk Score = 40% × anomaly_severity + 25% × performance_loss + 20% × persistence + 15% × asset_criticality
```

**Numerical example**
- `anomaly_severity` (from PyTorch model, 0-100) = 65
- `performance_loss` (from deviation_pct, normalized 0-100) = 78 (i.e. deviation_pct ≈ 78 capped/scaled)
- `persistence` (from Formula 8, scaled 0-100) = 80
- `asset_criticality` (asset-specific weight, e.g. large-capacity turbine) = 70

```
Risk Score = 0.40×65 + 0.25×78 + 0.20×80 + 0.15×70
           = 26 + 19.5 + 16 + 10.5
           = 72
```

**Sample output**
```json
{ "asset_id": "WT-07", "risk_score": 72, "risk_level": "High" }
```

**Interpretation**
72 falls in the 61-80 "High" band (Section 12) — schedule maintenance soon, not an immediate emergency but not deferrable to routine rounds either.

**PDF cross-check**
This *is* Section 12's formula verbatim — all prior formulas exist to produce the four inputs (`anomaly_severity`, `performance_loss`, `persistence`, `asset_criticality`) this equation combines.

**Variable mapping**
`risk_score` → determines `risk_level` (Low/Medium/High/Critical) → determines **maintenance queue position** (Section 8, Step 9).

---

## 10. Energy & Revenue Loss (from PDF Section 13)

**Formula (from report)**
```
energy_loss_kWh ≈ expected_power_kW × predicted_loss_fraction × expected_affected_hours
revenue_loss ≈ energy_loss_kWh × tariff_Rs_per_kWh
```

**Numerical example** (using WT-07 above)
- `expected_power_kW` = 500 (typical for available wind, per report's own example)
- `predicted_loss_fraction` = 0.12 (12%, from deviation_pct)
- `expected_affected_hours` = 6
- `tariff` = ₹5/kWh

```
energy_loss_kWh = 500 × 0.12 × 6 = 360 kWh
revenue_loss = 360 × 5 = ₹1,800
```

**Sample output**
```json
{ "asset_id": "WT-07", "energy_loss_kWh": 360, "revenue_loss_INR": 1800, "period_hours": 6 }
```

**Interpretation**
If WT-07's current issue is left unaddressed for the next 6 hours, the farm stands to lose ~360 kWh (~₹1,800) — this is the concrete, business-facing number that turns a technical anomaly score into an operational priority decision.

**PDF cross-check**
This is Section 13's example reproduced exactly — confirms the report's own worked numbers are internally consistent with the formula it states.

**Variable mapping**
`revenue_loss_INR` → displayed on dashboard alert (Section 8, Step 10) → used to **rank/justify** priority ordering in the technician queue, alongside `risk_score`.

---

## Full Variable Flow Map

```
Open-Meteo (GTI, temp, pressure, wind_speed, PM10)
        │
        ▼
Formula 1 (solar expected_power) ──┐         Formula 4/5/6 (wind expected_power) ──┐
Formula 2 (η_temp)                 │         Formula 6 (air density)                │
Formula 7 (soiling_derate)         │                                                │
        │                          │                                                │
        ▼                          ▼                                                ▼
   soiled_expected_kW ──► Formula 3 (deviation_pct) ◄──────────────────────────────┘
                                    │
                                    ▼
                          Formula 8 (persistence_score)
                                    │
                                    ▼
        PyTorch anomaly_severity (separate model, Section 11)
                                    │
                                    ▼
                    Formula 9 (Risk Score, Section 12)
                          ├──► risk_level (Low/Med/High/Critical)
                          └──► Formula 10 (energy/revenue loss, Section 13)
                                    │
                                    ▼
                    Alert + Priority Queue + Dashboard (Section 8, Steps 9-10)
```

## Score Variable Summary Table

| Variable | Range | Source | Feeds Into |
|---|---|---|---|
| `expected_power_kW` | asset-dependent | Formulas 1/4/5/6 | deviation_pct |
| `deviation_pct` | -∞ to 100% (typically 0-50%) | Formula 3 | performance_loss term, PyTorch features |
| `persistence_score` | 0.0 - 1.0 | Formula 8 | persistence term |
| `anomaly_severity` | 0 - 100 | PyTorch model | risk_score |
| `asset_criticality` | 0 - 100 | Asset registration (static) | risk_score |
| `risk_score` | 0 - 100 | Formula 9 | risk_level, priority queue |
| `risk_level` | Low/Medium/High/Critical | Risk score bands | dashboard, alert priority |
| `energy_loss_kWh` / `revenue_loss_INR` | asset-dependent | Formula 10 | dashboard, priority justification |
