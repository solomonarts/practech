import type { EventRecord, Scenario, SimState, Tool } from './types';

export const initialState = (): SimState => ({selectedPart:null,toolId:null,completed:[],removed:[],repaired:false,events:[],score:0,step:0});
const log = (action:string,detail:string,result:EventRecord['result'],points=0):EventRecord => ({id:crypto.randomUUID(),action,detail,result,points,timestamp:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});
export function applyOperation(state:SimState,scenario:Scenario,tool:Tool|null):SimState {
  const part=scenario.parts.find(p=>p.id===state.selectedPart);
  if(!tool) return {...state,events:[log('Tool required','Select a tool before applying an operation.','warning'),...state.events]};
  if(!part) return {...state,events:[log('Select a component','Choose a component in the model or hierarchy.','warning'),...state.events]};
  if(tool.id!==part.tool) return {...state,events:[log('Tool mismatch',`${tool.name} cannot be used on ${part.name}. Expected a compatible ${part.tool==='socket'?'socket wrench':part.tool==='multimeter'?'multimeter':part.tool==='pressure'?'pressure tester':'measurement tool'}.`,'warning'),...state.events]};
  const inspectId=`inspect:${part.id}`;
  if(!state.completed.includes(inspectId)) {
    const detail=scenario.readings[part.name] ?? `${part.role} inspected. Status recorded for this practical.`;
    return {...state,completed:[...state.completed,inspectId],score:Math.min(100,state.score+10),step:Math.min(state.step+1,scenario.steps.length),events:[log('Inspection recorded',detail,'success',10),...state.events]};
  }
  if(!state.repaired && part.id===scenario.parts[scenario.parts.length>2?Math.floor(scenario.parts.length/2):0].id) {
    return {...state,repaired:true,removed:[...state.removed,part.id],score:Math.min(100,state.score+25),step:Math.min(state.step+1,scenario.steps.length),events:[log('Repair completed',scenario.repair,'success',25),...state.events]};
  }
  return {...state,score:Math.min(100,state.score+5),events:[log('Operation recorded',`${part.name} checked using ${tool.name}.`,'info',5),...state.events]};
}
export function recordAction(state:SimState,action:string,detail:string,result:EventRecord['result']='info',points=0):SimState {
  return {...state,score:Math.max(0,Math.min(100,state.score+points)),events:[log(action,detail,result,points),...state.events]};
}
