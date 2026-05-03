export type ProjectOwnership = "owned" | "shared";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  ownership: ProjectOwnership;
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "p_001",
    name: "Realtime Chat Platform",
    slug: "realtime-chat-platform",
    ownership: "owned",
  },
  {
    id: "p_002",
    name: "Order Fulfillment Pipeline",
    slug: "order-fulfillment-pipeline",
    ownership: "owned",
  },
  {
    id: "p_003",
    name: "Analytics Warehouse",
    slug: "analytics-warehouse",
    ownership: "shared",
  },
];
