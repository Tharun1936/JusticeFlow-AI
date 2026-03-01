<h1 align="center">⚖️ NyayaFlow AI</h1>
<h3 align="center">AI‑Powered Judicial Case Backlog Prioritization System</h3>

<p align="center">
  <img src="https://img.shields.io/badge/domain-justice%20tech-blueviolet" />
  <img src="https://img.shields.io/badge/ai-ml%20%7C%20nlp-orange" />
  <img src="https://img.shields.io/badge/hardware-AMD%20EPYC%20%7C%20Instinct-red" />
  <img src="https://img.shields.io/badge/status-prototype-brightgreen" />
</p>

---

## 🚀 Overview

NyayaFlow AI is an **AI‑powered case prioritization and decision‑support system** that sits on top of existing e‑Courts / NJDG infrastructure and helps courts manage their massive case backlog more intelligently.

Instead of simple *first‑in, first‑out* listing, the system uses **machine learning, legal‑domain NLP, and fairness‑aware algorithms** to:

- Score every case by urgency, rights at stake, vulnerability, and delay risk  
- Generate **explainable, policy‑configurable cause lists** for judges and registries  
- Forecast backlog trends and support **data‑driven resource planning**  

The platform is **optimized for AMD EPYC CPUs and AMD Instinct GPUs using ROCm**, enabling government‑scale AI at efficient cost.

---

## 🎯 Problem Statement

- 50M+ cases are pending in Indian courts, many for years or decades.  
- Cause lists are still largely **manual or FIFO‑based**, not driven by urgency or social impact.  
- Existing e‑Courts systems digitize data but **do not provide smart decision support** for prioritization, risk prediction, or fairness.  

NyayaFlow AI addresses this by turning the backlog into a **ranked, explainable, and fair docket**.

---

## 💡 Solution Highlights

- 🔢 **Priority & Urgency Scoring** – ML models assign continuous scores and urgency bands to every case.
- 📉 **Risk‑of‑Delay Prediction** – Flags cases likely to breach 3/5‑year or statutory timelines.
- 📅 **Smart Cause‑List Generation** – Recommends balanced daily/weekly lists per bench.
- ⚖️ **Explainability & Fairness** – SHAP‑based explanations and fairness metrics for governance.
- 📊 **Backlog Analytics** – Heatmaps, trends, and forecasts for courts and policy makers.
- 🌐 **India‑First Legal NLP** – Tailored to Indian statutes, formats, and languages.
- 🧩 **Plug‑in Architecture** – Integrates with e‑Courts / NJDG via APIs; no rip‑and‑replace.

---

## 🧱 Architecture (High‑Level)

```text
Data Sources → Ingestion (Kafka/ETL) → Preprocessing & Feature Store
            → ML Engine (Priority / Urgency / Risk / NLP)
            → Explainability & Fairness Layer
            → API Gateway
            → Dashboards (Judge / Registry / Admin)
