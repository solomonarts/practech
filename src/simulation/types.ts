export type Discipline = 'Mechanical' | 'Electrical' | 'Civil' | 'Mechatronics';
export type Tool = { id: string; name: string; category: string; icon: string; use: string };
export type Part = { id: string; name: string; role: string; x: number; y: number; color: string; tool: string; phase: number };
export type Scenario = { id: string; discipline: Discipline; title: string; subtitle: string; equipment: string; task: string; fault: string; steps: string[]; parts: Part[]; tools: Tool[]; readings: Record<string, string>; readingTargets: Record<string, string>; repair: string };
export type ScenarioDefinition = Omit<Scenario, 'parts' | 'tools'>;
export type EventRecord = { id: string; action: string; detail: string; result: 'success' | 'warning' | 'info'; timestamp: string; points: number };
export type SimState = { selectedPart: string | null; toolId: string | null; completed: string[]; removed: string[]; repaired: boolean; events: EventRecord[]; score: number; step: number };
