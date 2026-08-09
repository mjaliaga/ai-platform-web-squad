import {
  siAngular,
  siApachekafka,
  siBun,
  siDocker,
  siFastapi,
  siGithubactions,
  siGrafana,
  siJson,
  siKeycloak,
  siKubernetes,
  siLangchain,
  siOpentelemetry,
  siPostgresql,
  siPrometheus,
  siPython,
  siReact,
  siRedis,
  siTerraform,
  siTypescript,
  siYaml,
} from "simple-icons";
import { Database, Flame, Terminal } from "lucide-react";

const BRAND_MAP = {
  "Python 3.12 + FastAPI": siPython,
  "Python 3.11+": siPython,
  Python: siPython,
  FastAPI: siFastapi,
  "Bun + TypeScript": siBun,
  Bun: siBun,
  TypeScript: siTypescript,
  "LangChain / LangGraph": siLangchain,
  LangChain: siLangchain,
  LangGraph: siLangchain,
  "React 18+ / Angular 17+": siReact,
  React: siReact,
  Angular: siAngular,
  "PostgreSQL 16 + pgvector": siPostgresql,
  PostgreSQL: siPostgresql,
  "Redis + Kafka": siRedis,
  Redis: siRedis,
  Kafka: siApachekafka,
  "OAuth2/JWT + Keycloak": siKeycloak,
  Keycloak: siKeycloak,
  "Prometheus + Grafana + OpenTelemetry": siPrometheus,
  Prometheus: siPrometheus,
  Grafana: siGrafana,
  OpenTelemetry: siOpentelemetry,
  Langfuse: null,
  Terraform: siTerraform,
  "Docker + Kubernetes": siDocker,
  Kubernetes: siKubernetes,
  "YAML (políticas)": siYaml,
  YAML: siYaml,
  "DOCX / JSON (reportes)": siJson,
  JSON: siJson,
  "GitHub Actions (quality gate)": siGithubactions,
  "GitHub Actions": siGithubactions,
};

const FALLBACK_ICONS = {
  Langfuse: Flame,
  "CLI security-assess": Terminal,
  pgvector: Database,
};

/** Icono de tecnología usando simple-icons; fallback a lucide o iniciales. */
export function TechIcon({ nombre, className = "h-4 w-4" }) {
  const Brand = BRAND_MAP[nombre];
  const Fallback = FALLBACK_ICONS[nombre];

  if (Brand) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        className={className}
        fill={`#${Brand.hex}`}
        dangerouslySetInnerHTML={{ __html: Brand.path }}
        aria-label={Brand.title}
      />
    );
  }

  if (Fallback) {
    const Icon = Fallback;
    return <Icon className={className} />;
  }

  const initial = nombre.charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
