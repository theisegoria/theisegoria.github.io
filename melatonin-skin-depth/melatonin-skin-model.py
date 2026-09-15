"""
Oral-vs-topical melatonin skin exposure model.
Units: mass ug, volume L (plasma) / cm^3 (tissue), time h, length cm.
Concentrations reported in ng/mL == ug/L == ug/cm^3*1e3 careful: 1 ug/cm^3 = 1 ug/mL = 1000 ng/mL
"""
import numpy as np

MW = 232.28  # g/mol melatonin

# ---------------------------------------------------------------- PK (systemic)
BW      = 70.0          # kg
Vd      = 1.2 * BW      # L            Andersen 2016 (IV), 1.2 (0.6) L/kg
CL      = 0.0218 * 60 * BW  # L/h      0.0218 (0.0102) L/min/kg -> 91.6 L/h
t12_el  = 53.7 / 60     # h            oral elimination t1/2 53.7 (7.0) min
ke      = np.log(2) / t12_el
# reconcile: CL_from_ke = ke*Vd
CL_ke   = ke * Vd
CL      = CL_ke         # use internally consistent pair (Vd, ke)
t12_abs = 6.0 / 60      # h            oral absorption t1/2 6.0 (3.1) min
ka      = np.log(2) / t12_abs
F_oral  = 0.025         # median absolute bioavailability 2.5% (IQR 1.7-4.7)
F_LO, F_HI = 0.017, 0.047

def c_plasma_IR(t, dose_mg, F=F_oral, ka=ka, ke=ke, Vd=Vd):
    """ug/L (= pg/mL*1e-3... careful: ug/L = ng/mL). One-compartment, 1st-order abs."""
    D = dose_mg * 1000.0  # ug
    t = np.asarray(t, float)
    return (F * D * ka) / (Vd * (ka - ke)) * (np.exp(-ke * t) - np.exp(-ka * t))

def c_plasma_SR(t, dose_mg, T_rel=8.0, F=F_oral, ke=ke, Vd=Vd):
    """Zero-order release over T_rel h then 1st-order elimination. ng/mL."""
    D = dose_mg * 1000.0
    k0 = F * D / T_rel          # ug/h input
    t = np.asarray(t, float)
    up = (k0 / (ke * Vd)) * (1 - np.exp(-ke * np.minimum(t, T_rel)))
    return np.where(t <= T_rel, up, up * np.exp(-ke * np.maximum(t - T_rel, 0)))

def auc24_ngml_h(dose_mg, F=F_oral):
    """Total 24-h AUC (ng/mL*h) for a single daily dose; identical IR vs SR."""
    return F * dose_mg * 1000.0 / (ke * Vd)

def cavg24(dose_mg, F=F_oral):
    return auc24_ngml_h(dose_mg, F) / 24.0

# ---------------------------------------------------------------- skin geometry / transport
H_SC    = 20e-4         # cm   stratum corneum 20 um
H_VE    = 80e-4         # cm   viable epidermis 80 um (avascular)
D_tis   = 5e-6 * 3600   # cm^2/h  small-molecule diffusivity in viable tissue = 0.018
Q_derm  = 3.0           # 1/h  dermal perfusion per unit tissue volume (~0.05 mL/min/mL)
Kp_skin = 1.0           # tissue:plasma partition coefficient (perfusion-limited, logP 1.2)
LAM     = np.sqrt(D_tis * Kp_skin / Q_derm)   # cm, penetration decay length

def decay_length(D=D_tis, Q=Q_derm, Kp=Kp_skin):
    return np.sqrt(D * Kp / Q)

# effective areal clearance of the perfused dermis (cm/h): J = k_eff * C(at plexus)
def k_eff(lam=None, D=D_tis):
    lam = decay_length() if lam is None else lam
    return D / lam

# ---------------------------------------------------------------- topical input
# Empirical anchors: steady serum rise (pg/mL) after once-daily application
#   0.01% cream  -> ~ 9 pg/mL (24 h)      Fischer 2004 penetration study
#   0.01% soln   -> ~12.7 pg/mL
#   0.03% soln   -> ~19   pg/mL
#   0.10% soln   -> 35-50 vs 5-10 placebo => delta ~30 pg/mL   Fischer 2004 AGA trial
BASELINE_SERUM = 5.0    # pg/mL daytime physiological floor
ANCHORS = {0.01: 12.7 - BASELINE_SERUM, 0.03: 19.0 - BASELINE_SERUM, 0.10: 30.0}
# power law delta_serum = a * pct^b
_p = np.polyfit(np.log([0.01, 0.03, 0.10]), np.log([7.7, 14.0, 30.0]), 1)
TOP_B, TOP_A = _p[0], np.exp(_p[1])

APPLIED_UL_REF = 1000.0   # uL of vehicle in the anchor studies (1 mL to scalp)

def f_absorbed(pct):
    """Fraction of the applied melatonin that crosses the stratum corneum in 24 h.
    Falls with load (saturable SC partitioning): f = f_ref*(pct/0.1)^(b-1)."""
    dser_ref = TOP_A * 0.1 ** TOP_B
    applied_ref = 0.1 / 100.0 * APPLIED_UL_REF * 1e-3 * 1e6   # ug in 1 mL of 0.1%
    f_ref = dser_ref * 1e-3 * CL * 24.0 / applied_ref
    return f_ref * (pct / 0.1) ** (TOP_B - 1.0)

def delivered_ug_per_day(pct, area_cm2, applied_uL=APPLIED_UL_REF):
    """Melatonin crossing into viable skin per day (ug)."""
    applied_ug = pct / 100.0 * applied_uL * 1e-3 * 1e6
    return f_absorbed(pct) * applied_ug

def topical_flux(pct, area_cm2, applied_uL=APPLIED_UL_REF):
    """ug/cm^2/h entering the viable epidermis."""
    return delivered_ug_per_day(pct, area_cm2, applied_uL) / (area_cm2 * 24.0)

def c_topical_depth(x_cm, pct, area_cm2, lam=None, D=D_tis):
    """Steady-state topical-derived tissue conc (ng/mL) vs depth x below SC/VE interface."""
    lam = decay_length() if lam is None else lam
    J = topical_flux(pct, area_cm2)                      # ug/cm^2/h
    C_plexus = J * lam / D                               # ug/cm^3 = mg/L -> *1e3 ng/mL
    C_plexus_ng = C_plexus * 1e3
    x = np.asarray(x_cm, float)
    # avascular viable epidermis: linear rise above the plexus
    c_epi = C_plexus_ng + J * (H_VE - x) / D * 1e3
    c_derm = C_plexus_ng * np.exp(-(x - H_VE) / lam)
    return np.where(x <= H_VE, c_epi, c_derm)

def c_vehicle_ngml(pct):
    """Concentration in the applied vehicle / follicular duct reservoir, ng/mL."""
    return pct / 100.0 * 1e9 / 1000.0    # pct% w/v -> g/100mL -> ng/mL

def required_oral_mg(x_cm, pct, area_cm2, Kp=Kp_skin, F=F_oral, lam=None, D=D_tis):
    """Oral daily dose whose 24-h average tissue conc equals the topical steady conc at depth x."""
    target = c_topical_depth(x_cm, pct, area_cm2, lam=lam, D=D)
    # oral tissue conc = Kp * C_plasma ; need Kp*cavg24(dose) = target
    # cavg24 = F*dose*1000/(ke*Vd*24)
    return target / Kp * ke * Vd * 24.0 / (F * 1000.0)

def oral_tissue_conc(dose_mg, Kp=Kp_skin, F=F_oral):
    return Kp * cavg24(dose_mg, F)

# ---------------------------------------------------------------- TAC
TAC_BASE_mM = 1.5           # mmol/L Trolox equivalents, typical plasma
TEAC_MEL    = 1.0           # mol Trolox eq per mol melatonin (assay range 0.4-2.7)
TEAC_CASCADE = 4.0          # upper bound with AFMK/AMK scavenging cascade

def direct_tac_fraction(dose_mg, teac=TEAC_MEL, F=F_oral, peak=True):
    """Fractional rise in plasma TAC from melatonin's own radical-scavenging stoichiometry."""
    c_ngml = (F * dose_mg * 1000.0 / Vd) if peak else cavg24(dose_mg, F)
    c_M = c_ngml * 1e-9 / (MW * 1e-3)      # ng/mL -> g/L -> mol/L
    return teac * c_M / (TAC_BASE_mM * 1e-3)

def indirect_tac(dose_mg, Emax_r=0.28, EC50_r=0.15, Emax_m=0.55, EC50_m_mg=900.0, hill=1.0):
    """Two-component Emax: MT1/MT2-receptor-mediated (saturates < 1 mg) plus a
    mass-action / Nrf2-type component with EC50 in the high-mg range.
    Returns fractional rise in measured plasma TAC."""
    d = np.asarray(dose_mg, float)
    rec = Emax_r * d**hill / (EC50_r**hill + d**hill)
    mas = Emax_m * d / (EC50_m_mg + d)
    return rec + mas

if __name__ == "__main__":
    print(f"Vd={Vd:.1f} L  CL={CL:.1f} L/h  ke={ke:.3f}/h  ka={ka:.2f}/h  F={F_oral}")
    print(f"lambda = {decay_length()*1e4:.0f} um   k_eff = {k_eff():.3f} cm/h")
    print(f"topical power law: delta_serum = {TOP_A:.1f} * pct^{TOP_B:.2f} pg/mL")
    for d in [6, 10, 20, 50, 100]:
        t = np.linspace(0, 24, 20000)
        c = c_plasma_IR(t, d)
        print(f"IR {d:4} mg: Cmax {c.max()*1000:7.0f} pg/mL  Cavg24 {cavg24(d)*1000:6.1f} pg/mL")
    print("0.1% scalp: delivered", delivered_ug_per_day(0.1, 600), "ug/day")
    for x_um in [80, 300, 1000, 3000]:
        x = x_um * 1e-4
        print(f"  depth {x_um:5} um: topical {c_topical_depth(x,0.1,600):8.3f} ng/mL  "
              f"required oral {required_oral_mg(x,0.1,600):9.1f} mg")

def required_oral_mg_from_conc(target_ngml, Kp=Kp_skin, F=F_oral):
    """Oral daily dose whose 24-h mean tissue concentration equals target_ngml."""
    return target_ngml / Kp * ke * Vd * 24.0 / (F * 1000.0)
