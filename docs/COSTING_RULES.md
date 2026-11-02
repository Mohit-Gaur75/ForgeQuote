# ForgeQuote — Costing Engine & Financial Calculation Rules

**Module**: `server/src/modules/costing`  
**Precision Engine**: `decimal.js` (Arbitrary-Precision Decimal Arithmetic)  
**Authoritative Source**: Backend Engine Only (AI is strictly prohibited from performing financial calculations)  
**Calculation Version**: `v1.0`

---

## 1. Mathematical Formulas & Costing Sequence

All calculations execute sequentially in a strictly deterministic pipeline. At no point are standard IEEE 754 binary floating-point numbers used for monetary or weight operations.

```
       Deterministic Costing Pipeline
┌──────────────────────────────────────────────┐
│  Inputs: Net Wt, Gross Wt, Scrap %, Mat Rate │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 1: Material Cost Calculation            │
│ Gross Wt = Gross Wt OR Net Wt / (1 - Scrap%) │
│ Material Cost = Gross Wt × Material Rate/kg  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 2: Conversion Cost Calculation          │
│ Op Cost = (Cycle Time Min / 60) × M/C Rate   │
│ Conversion Cost = Σ Op Costs                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 3: Setup Cost Amortisation              │
│ Setup Cost = (Setup Hrs × M/C Rate) / Volume │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 4: Factory Overhead Cost                │
│ Overhead = (Conversion + Setup) × Overhead % │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 5: Total Unit Cost                      │
│ Cost = Mat + Conv + Setup + OH + Pack + Frt  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 6: Commercial Gross Margin              │
│ Selling Price = Total Cost / (1 - Margin %)  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Step 7: GST & Final Price                    │
│ GST = Selling Price × (GST % / 100)          │
│ Final Price = Selling Price + GST            │
└──────────────────────────────────────────────┘
```

---

## 2. Detailed Formulation

### 2.1 Step 1: Raw Material Cost
* **Input Parameters**:
  * $W_{\text{net}}$: Net finished part weight in kilograms.
  * $W_{\text{gross}}$: Gross raw bar/forging weight in kilograms (optional).
  * $S_{\text{scrap}}$: Expected manufacturing scrap percentage ($0 \le S_{\text{scrap}} < 100$).
  * $R_{\text{mat}}$: Material rate per kilogram in INR.

* **Gross Weight Determination**:
  If gross weight is supplied by customer:
  $$W_{\text{gross}} = W_{\text{gross\_input}}$$
  If gross weight is missing, it is derived deterministically:
  $$W_{\text{gross}} = \frac{W_{\text{net}}}{1 - \frac{S_{\text{scrap}}}{100}}$$

* **Consistency Check**:
  If both $W_{\text{gross}}$ and $W_{\text{net}}$ are provided:
  $$S_{\text{derived}} = \left(1 - \frac{W_{\text{net}}}{W_{\text{gross}}}\right) \times 100$$
  If $|S_{\text{derived}} - S_{\text{scrap}}| > 1.0\%$, a warning is raised for engineering review.

* **Material Cost per Unit**:
  $$C_{\text{material}} = W_{\text{gross}} \times R_{\text{mat}}$$

---

### 2.2 Step 2: Conversion (Machining) Cost
A part routing contains $n$ sequential machining operations (e.g. Rough Turning, Finish Facing, Milling, Drilling, Induction Hardening, Cylindrical Grinding).

* **Input Parameters for Operation $i$**:
  * $T_{\text{cycle}, i}$: Operation cycle time in minutes.
  * $R_{\text{machine}, i}$: Machine-hour rate in INR for the assigned machine center.

* **Single Operation Cost**:
  $$C_{\text{op}, i} = \left(\frac{T_{\text{cycle}, i}}{60}\right) \times R_{\text{machine}, i}$$

* **Total Conversion Cost**:
  $$C_{\text{conversion}} = \sum_{i=1}^{n} C_{\text{op}, i}$$

---

### 2.3 Step 3: Setup Amortisation Cost
Machine tooling setup, fixture alignment, and first-piece inspection hours must be amortised across the quoted production batch or annual contract volume.

* **Input Parameters for Operation $i$**:
  * $H_{\text{setup}, i}$: Setup time in hours.
  * $R_{\text{machine}, i}$: Machine-hour rate for that operation.
  * $V$: Quoted volume tier (e.g. 50%, 100%, 150%).

* **Setup Cost per Unit**:
  $$C_{\text{setup}} = \sum_{i=1}^{n} \frac{H_{\text{setup}, i} \times R_{\text{machine}, i}}{V}$$

* **Double Counting Prevention**: If setup is specified at the part level rather than operation level, the primary machining center rate is applied once. Setup hours must never be counted both at part-level and operation-level.

---

### 2.4 Step 4: Factory Overhead Cost
Factory overhead accounts for non-machining plant expenses (electricity, cutting fluids, tool wear, quality inspection, supervisory overhead).
* **Input Parameters**:
  * $P_{\text{overhead}}$: Configured overhead percentage (e.g. 4.0%, 8.0%).

* **Formula**:
  $$C_{\text{overhead}} = (C_{\text{conversion}} + C_{\text{setup}}) \times \frac{P_{\text{overhead}}}{100}$$

---

### 2.5 Step 5: Packaging & Freight Logistics
* **Input Parameters**:
  * $C_{\text{packing}}$: Specific unit packing cost (corrugated box, VCI anti-rust paper, plastic pallets).
  * $C_{\text{freight}}$: Specific unit freight cost (Chakan to customer plant transport).

---

### 2.6 Step 6: Total Unit Manufacturing Cost
$$C_{\text{total}} = C_{\text{material}} + C_{\text{conversion}} + C_{\text{setup}} + C_{\text{overhead}} + C_{\text{packing}} + C_{\text{freight}}$$

---

### 2.7 Step 7: Commercial Gross Margin & Selling Price
* **Gross Margin vs Markup**:
  ForgeQuote strictly applies **Gross Margin**, not Markup.
  $$\text{Margin } \% = \frac{\text{Selling Price} - \text{Total Cost}}{\text{Selling Price}} \times 100$$

* **Selling Price (Pre-GST)**:
  $$P_{\text{selling}} = \frac{C_{\text{total}}}{1 - \frac{M_{\text{margin}}}{100}}$$

* **Boundary Guard**:
  Margin percentages $M_{\text{margin}} \ge 100\%$ are mathematically impossible and are rejected with HTTP 422.

---

### 2.8 Step 8: Goods and Services Tax (GST) & Final Quoted Price
* **Input Parameter**:
  * $P_{\text{gst}}$: GST percentage (18.00% demo default for automotive metal components under HSN 8708/8483).

* **GST Amount per Unit**:
  $$A_{\text{gst}} = P_{\text{selling}} \times \frac{P_{\text{gst}}}{100}$$

* **Final Unit Selling Price**:
  $$P_{\text{final}} = P_{\text{selling}} + A_{\text{gst}}$$

---

## 3. Volume Tier Calculations (50%, 100%, 150%)

Automotive OEM procurement typically requests quotation matrices across annual volume tiers:
1. **Tier 1 (50% Volume)**: $V_{\text{tier1}} = 0.50 \times V_{\text{base}}$
2. **Tier 2 (100% Volume — Baseline)**: $V_{\text{tier2}} = 1.00 \times V_{\text{base}}$
3. **Tier 3 (150% Volume)**: $V_{\text{tier3}} = 1.50 \times V_{\text{base}}$

### Impact of Volume on Cost Structure
* **Variable Costs** ($C_{\text{material}}$, $C_{\text{conversion}}$, $C_{\text{packing}}$, $C_{\text{freight}}$) remain constant per unit across all tiers.
* **Fixed Setup Cost** ($C_{\text{setup}}$) is recalculated for each tier:
  * At 50% volume, setup cost per unit doubles ($\times 2.0$).
  * At 150% volume, setup cost per unit reduces by 33.3% ($\times 0.667$).
* Total unit cost, selling price, GST, and final price are recomputed accordingly for each tier.

---

## 4. Rounding Policy & Numerical Precision

To prevent multi-line accumulated rounding errors:
1. **Intermediate Calculations**: Retain full precision using `decimal.js` object instances. No intermediate rounding to 2 decimal places.
2. **Display Presentation**: Unit costs and unit selling prices are formatted to **2 decimal places** using standard half-up rounding:
   ```javascript
   value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
   ```
3. **Quotation Line Totals**: Line total = $\text{Final Price} \times \text{Quoted Annual Quantity}$, rounded to 2 decimal places.
4. **Database Storage**: Unit fields stored in `DECIMAL(12, 4)`; totals stored in `DECIMAL(14, 2)`.

---

## 5. Reference Demonstration Test Benchmarks

The following three parts represent standard manufacturing parts produced at Company A in Chakan. All automated test suites must pass these exact reference calculations.

### Part Profiles & Inputs

| Parameter | Part A: Spindle | Part B: Lift Arm | Part C: Gear Blank |
|---|---|---|---|
| Part Description | Rear Wheel Spindle | Hydraulic Lift Arm | Intermediate Gear Blank |
| Material Grade | EN8 Bright Bar | 40Cr4 Forging | 20MnCr5 Forged Ring |
| Net Weight | 0.61 kg | 4.60 kg | 1.48 kg |
| Expected Scrap | 5.0% | 8.0% | 6.0% |
| Derived Gross Weight | 0.642105 kg | 5.000000 kg | 1.574468 kg |
| Base Annual Volume | 180,000 units | 24,000 units | 60,000 units |
| Material Rate per kg | ₹85.00 | ₹110.00 | ₹125.00 |
| Machining Cycle Time | 3.20 minutes | 11.50 minutes | 4.80 minutes |
| Machine-Hour Rate | ₹850.00 / hr | ₹1,450.00 / hr | ₹950.00 / hr |
| Setup Hours | 2.00 hrs | 4.00 hrs | 3.00 hrs |
| Factory Overhead % | 4.0% | 8.0% | 6.0% |
| Packing Cost / Unit | ₹4.00 | ₹12.00 | ₹7.00 |
| Freight Cost / Unit | ₹2.00 | ₹6.00 | ₹3.00 |
| Target Gross Margin | 15.0% | 15.0% | 15.0% |
| Applicable GST % | 18.0% | 18.0% | 18.0% |

### Exact Benchmark Calculation Results (100% Volume Tier)

| Cost Component | Part A: Spindle | Part B: Lift Arm | Part C: Gear Blank |
|---|---|---|---|
| **Material Cost** | **₹54.58** | **₹550.00** | **₹196.81** |
| **Conversion Cost** | **₹45.33** | **₹277.92** | **₹76.00** |
| **Setup Cost** | **₹0.01** | **₹0.24** | **₹0.05** |
| **Overhead Cost** | **₹1.81** | **₹22.25** | **₹4.56** |
| **Packing Cost** | **₹4.00** | **₹12.00** | **₹7.00** |
| **Freight Cost** | **₹2.00** | **₹6.00** | **₹3.00** |
| **Total Unit Cost** | **₹107.74** | **₹868.41** | **₹287.42** |
| **Selling Price (Pre-GST)** | **₹126.75** | **₹1,021.66** | **₹338.14** |
| **GST Amount (18%)** | **₹22.82** | **₹183.90** | **₹60.87** |
| **Final Unit Selling Price** | **₹149.56** | **₹1,205.56** | **₹399.01** |
| **Annual Pre-GST Value** | **₹2,28,15,000** | **₹2,45,19,840** | **₹2,02,88,400** |
| **Commercial Approval Needed?** | **YES (> ₹25 Lakh)** | **YES (> ₹25 Lakh)** | **YES (> ₹25 Lakh)** |

---

## 6. Boundary Conditions & Edge Case Test Matrix

| Test Scenario | Input Deviation | Expected Engine Behavior |
|---|---|---|
| **Zero Scrap** | Scrap = 0.0% | Gross weight equals net weight exactly. Material cost = $W_{\text{net}} \times R_{\text{mat}}$. |
| **Zero Setup Hours** | Setup = 0.0 hrs | Setup cost = ₹0.00. No division by zero. |
| **Zero Cycle Time** | Cycle Time = 0.0 min | Conversion cost = ₹0.00. |
| **Invalid Margin $\ge 100\%$** | Margin = 100% or 105% | Engine throws `BusinessRuleError("Gross margin must be less than 100%")` (HTTP 422). |
| **Negative Values** | Weight = -0.5 kg | Zod schema validation blocks request with HTTP 400. |
| **Missing Rate Version** | Machine type has no active rate | Engine throws `NotFoundError("No effective rate found for machine")` (HTTP 404). |
| **Gross < Net Weight** | Gross = 0.5 kg, Net = 0.6 kg | Engine flags validation error: Gross weight cannot be less than net weight. |
