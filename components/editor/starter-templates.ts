import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  type CanvasEdge,
  type CanvasNode,
  type NodeColor,
  type NodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface NodeOptions {
  width?: number;
  height?: number;
  color?: NodeColor;
  shape?: NodeShape;
}

function node(
  id: string,
  label: string,
  x: number,
  y: number,
  options: NodeOptions = {},
): CanvasNode {
  const width = options.width ?? 160;
  const height = options.height ?? 80;
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    width,
    height,
    data: {
      label,
      color: options.color ?? DEFAULT_NODE_COLOR,
      shape: options.shape ?? DEFAULT_NODE_SHAPE,
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
): CanvasEdge {
  return {
    id,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    data: label ? { label } : {},
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "Web and mobile clients route through an API gateway to auth, orders, and payments services, each backed by its own datastore.",
  nodes: [
    node("web", "Web Client", 0, 0, { color: "blue", shape: "rectangle" }),
    node("mobile", "Mobile Client", 0, 120, {
      color: "blue",
      shape: "rectangle",
    }),
    node("gateway", "API Gateway", 240, 60, {
      color: "purple",
      shape: "hexagon",
      width: 160,
      height: 100,
    }),
    node("auth", "Auth Service", 480, -80, {
      color: "teal",
      shape: "rectangle",
    }),
    node("orders", "Orders Service", 480, 60, {
      color: "teal",
      shape: "rectangle",
    }),
    node("payments", "Payments Service", 480, 200, {
      color: "teal",
      shape: "rectangle",
    }),
    node("auth-db", "Users DB", 720, -80, {
      color: "orange",
      shape: "cylinder",
      width: 140,
      height: 100,
    }),
    node("orders-db", "Orders DB", 720, 60, {
      color: "orange",
      shape: "cylinder",
      width: 140,
      height: 100,
    }),
    node("payments-db", "Payments DB", 720, 200, {
      color: "orange",
      shape: "cylinder",
      width: 140,
      height: 100,
    }),
  ],
  edges: [
    edge("e-web-gw", "web", "gateway", "HTTPS"),
    edge("e-mob-gw", "mobile", "gateway", "HTTPS"),
    edge("e-gw-auth", "gateway", "auth"),
    edge("e-gw-orders", "gateway", "orders"),
    edge("e-gw-payments", "gateway", "payments"),
    edge("e-auth-db", "auth", "auth-db"),
    edge("e-orders-db", "orders", "orders-db"),
    edge("e-payments-db", "payments", "payments-db"),
    edge("e-orders-payments", "orders", "payments", "Charge"),
  ],
};

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "From a developer commit through build, test, and security gates into staging and production deployments with monitoring feedback.",
  nodes: [
    node("dev", "Developer", 0, 60, {
      color: "neutral",
      shape: "circle",
      width: 110,
      height: 110,
    }),
    node("repo", "Git Repository", 200, 60, {
      color: "purple",
      shape: "rectangle",
    }),
    node("build", "Build", 400, 60, { color: "blue", shape: "rectangle" }),
    node("test", "Run Tests", 600, -40, {
      color: "green",
      shape: "rectangle",
    }),
    node("security", "Security Scan", 600, 160, {
      color: "orange",
      shape: "rectangle",
    }),
    node("gate", "Approval Gate", 820, 60, {
      color: "pink",
      shape: "diamond",
      width: 140,
      height: 140,
    }),
    node("staging", "Staging", 1040, -40, {
      color: "teal",
      shape: "pill",
    }),
    node("prod", "Production", 1040, 160, {
      color: "teal",
      shape: "pill",
    }),
    node("monitor", "Monitoring", 1260, 60, {
      color: "red",
      shape: "hexagon",
      width: 150,
      height: 110,
    }),
  ],
  edges: [
    edge("e-dev-repo", "dev", "repo", "Push"),
    edge("e-repo-build", "repo", "build", "Webhook"),
    edge("e-build-test", "build", "test"),
    edge("e-build-security", "build", "security"),
    edge("e-test-gate", "test", "gate"),
    edge("e-security-gate", "security", "gate"),
    edge("e-gate-staging", "gate", "staging", "Auto"),
    edge("e-gate-prod", "gate", "prod", "Approved"),
    edge("e-staging-monitor", "staging", "monitor"),
    edge("e-prod-monitor", "prod", "monitor"),
    edge("e-monitor-dev", "monitor", "dev", "Alerts"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish to an event bus that fans out to consumers and storage, with a stream processor enriching events into analytics.",
  nodes: [
    node("producer-a", "Order Producer", 0, 0, {
      color: "blue",
      shape: "rectangle",
    }),
    node("producer-b", "Inventory Producer", 0, 140, {
      color: "blue",
      shape: "rectangle",
    }),
    node("bus", "Event Bus", 260, 70, {
      color: "purple",
      shape: "pill",
      width: 180,
      height: 80,
    }),
    node("stream", "Stream Processor", 520, -60, {
      color: "pink",
      shape: "diamond",
      width: 160,
      height: 140,
    }),
    node("notifications", "Notifications", 520, 140, {
      color: "green",
      shape: "rectangle",
    }),
    node("audit", "Audit Log", 520, 260, {
      color: "orange",
      shape: "cylinder",
      width: 150,
      height: 100,
    }),
    node("analytics", "Analytics Store", 780, -60, {
      color: "teal",
      shape: "cylinder",
      width: 160,
      height: 110,
    }),
    node("dashboard", "Dashboard", 1020, -60, {
      color: "neutral",
      shape: "rectangle",
    }),
  ],
  edges: [
    edge("e-pa-bus", "producer-a", "bus", "OrderPlaced"),
    edge("e-pb-bus", "producer-b", "bus", "StockChanged"),
    edge("e-bus-stream", "bus", "stream"),
    edge("e-bus-notifications", "bus", "notifications"),
    edge("e-bus-audit", "bus", "audit"),
    edge("e-stream-analytics", "stream", "analytics"),
    edge("e-analytics-dashboard", "analytics", "dashboard"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  eventDriven,
];
