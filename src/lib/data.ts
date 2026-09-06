export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  bullets: string[];
  tech: string[];
  link?: string;
  linkLabel?: string;
  accent: string;
  /** Screen content for the laptop mockup. Omit to show the placeholder. */
  media?: { type: "video"; src: string } | { type: "image"; src: string };
};

export const projects: Project[] = [
  {
    slug: "llm-observability",
    title: "LLM Observability Platform",
    tagline: "4Way Technologies — Data Engineering",
    description:
      "Designed the schema and system architecture for tracking chat and image inference metrics across every model in production, from raw event to executive dashboard.",
    bullets: [
      "Airflow + PySpark pipelines ingest Kinesis Firehose events into Delta Lake with schema enforcement, partitioning, and ACID storage",
      "Retry logic and dead-letter handling keep the pipeline reliable under bad payloads",
      "Metabase dashboard over Trino SQL tracks LLM KPIs, cost trends, and feedback patterns across models",
      "Migrated infra from Databricks to local PySpark + Streamlit, cutting cloud cost while preserving distributed compute",
    ],
    tech: ["Airflow", "PySpark", "Delta Lake", "Kinesis", "Trino", "Metabase", "Docker"],
    accent: "#7c8cff",
    // media: { type: "video", src: "/projects/llm-observability.mp4" },
  },
  {
    slug: "emotion-classifier",
    title: "Self-Improving Emotion Classifier",
    tagline: "Autonomous retraining pipeline with feedback loop",
    description:
      "A TinyLlama emotion classifier that gets better on its own — logging uncertain predictions, curating them, and only promoting a new adapter when it actually beats the last one.",
    bullets: [
      "Fine-tuned TinyLlama with QLoRA (4-bit) on GoEmotions for multi-class classification with structured JSON output",
      "Confidence-based filtering logs uncertain predictions to SQLite to surface retraining candidates",
      "Adapter promotion mechanism benchmarks new LoRA adapters against the current version, promoting only on F1 improvement",
      "Version-tracked adapters (adapter_v1, adapter_v2, …) implement a real data flywheel",
    ],
    tech: ["Python", "Transformers", "PEFT", "BitsAndBytes", "Scikit-learn", "Streamlit"],
    link: "https://github.com/dronaop",
    linkLabel: "View on GitHub",
    accent: "#ff8a5c",
    // media: { type: "video", src: "/projects/emotion-classifier.mp4" },
  },
  {
    slug: "plant-easy-care",
    title: "Plant Easy Care",
    tagline: "AI-driven plant disease detection & care platform",
    description:
      "A full-stack platform that diagnoses plant disease from a photo and forecasts care needs from environmental sensor data — built to scale past a single model demo.",
    bullets: [
      "CNN plant disease detector hits 97% accuracy across 27K+ images using EfficientNet and transfer learning",
      "LSTM multivariate forecasting across six environmental and plant-health metrics for predictive care",
      "Community forum, Q&A, and e-commerce module on top of the ML core",
      "Models served via TensorFlow Serving and FastAPI REST APIs on AWS",
    ],
    tech: ["TensorFlow", "CNN", "EfficientNet", "LSTM", "FastAPI", "MongoDB", "AWS"],
    link: "https://github.com/dronaop",
    linkLabel: "View on GitHub",
    accent: "#4cd6b0",
    // media: { type: "image", src: "/projects/plant-easy-care.jpg" },
  },
];

export const experience = [
  {
    company: "4Way Technologies",
    role: "AI/ML Developer",
    period: "Jul 2025 — Present",
    location: "Delhi",
    points: [
      "Designed LLM observability schema and system architecture; built Airflow + PySpark pipelines into Delta Lake",
      "Fine-tuned TinyLlama (QLoRA) for a 12-language JSON translation pipeline and Phi-3 for emotion detection",
      "Built agentic RAG for long-term memory: async CUD memory ops, MongoDB Atlas vector search, ChromaDB MMR retrieval",
      "Dockerized Stable Diffusion / Qwen-image / Wan as GPU microservices across RunPod and Novita",
    ],
  },
  {
    company: "ACMA",
    role: "Data Analyst Intern",
    period: "Jul 2024 — Aug 2024",
    location: "Delhi",
    points: [
      "Cleaned and analyzed registration datasets to surface attendance and registration trends",
      "Built an automated email dispatch pipeline for event notifications and confirmations",
    ],
  },
];

export const skillGroups = [
  { label: "GenAI & LLMs", items: ["LangChain", "LlamaIndex", "RAG Pipelines", "ChromaDB", "Fine-Tuning", "Stable Diffusion", "FastAPI"] },
  { label: "ML / AI", items: ["Transformers", "LoRA / PEFT", "BERT", "Quantization", "XGBoost", "EfficientNet"] },
  { label: "Data Engineering", items: ["Apache Spark", "PySpark", "Airflow", "Delta Lake", "Kafka", "Databricks"] },
  { label: "Cloud & Data", items: ["AWS", "MongoDB", "PostgreSQL", "MySQL", "DuckDB", "Trino"] },
];
