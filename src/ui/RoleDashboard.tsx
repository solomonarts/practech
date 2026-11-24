import { Activity, Award, BookOpen, Check, ClipboardCheck, FileCheck2, GraduationCap, MessageCircle, ShieldCheck, Users, Wrench } from 'lucide-react';
import { loadExercises, loadModels, loadSubmissions } from '../content/library';
import { loadCertificates, loadEnrollments, loadInteractions, loadModules } from '../platform/store';
import type { ContentRole } from './ContentHub';

type StaffRole=Extract<ContentRole,'Tutor'|'Admin'>;
type Destination='Module Management'|'Session Management'|'Tutor Progress'|'Tutor Messages'|'Program Administration'|'Reviews & Approvals'|'Content Administration'|'3D Model Library';
const actions:Record<StaffRole,{label:Destination;description:string;icon:typeof BookOpen}[]>={
 Tutor:[
  {label:'Module Management',description:'Create and revise learning modules.',icon:BookOpen},
  {label:'Session Management',description:'Author practical sessions for review.',icon:ClipboardCheck},
  {label:'Tutor Progress',description:'Follow enrolled learner progress.',icon:Activity},
  {label:'Tutor Messages',description:'Respond to student interactions.',icon:MessageCircle},
 ],
 Admin:[
  {label:'Reviews & Approvals',description:'Review tutor and model submissions.',icon:Check},
  {label:'Program Administration',description:'Approve module revisions and programs.',icon:ShieldCheck},
  {label:'Content Administration',description:'Monitor content quality and licensing.',icon:FileCheck2},
  {label:'Module Management',description:'Review modules across disciplines.',icon:BookOpen},
 ],
};

export default function RoleDashboard({role,onNavigate}:{role:StaffRole;onNavigate:(page:Destination)=>void}){
 const modules=loadModules();const exercises=loadExercises();const enrollments=loadEnrollments();const interactions=loadInteractions();const submissions=loadSubmissions();const certificates=loadCertificates();const models=loadModels();
 const openMessages=interactions.filter(x=>x.status==='Open').length;
 const pendingModules=modules.filter(x=>x.status==='Pending Review').length;
 const pendingSubmissions=submissions.filter(x=>!['Published','Rejected'].includes(x.status)).length;
 const stats=role==='Tutor'?
  [{label:'Assigned learners',value:enrollments.length,icon:Users},{label:'Modules awaiting review',value:pendingModules,icon:BookOpen},{label:'Open student messages',value:openMessages,icon:MessageCircle},{label:'Published sessions',value:exercises.filter(x=>x.status==='Published').length,icon:ClipboardCheck}]:
  [{label:'Enrolled programs',value:enrollments.length,icon:GraduationCap},{label:'Pending content reviews',value:pendingSubmissions+pendingModules,icon:ShieldCheck},{label:'3D model records',value:models.length,icon:Wrench},{label:'Certificates issued',value:certificates.length,icon:Award}];
 return <div className="role-dashboard"><div className="welcome-row"><div><div className="eyebrow">{role.toUpperCase()} WORKSPACE <span className="eyebrow-line"/></div><h1>{role==='Tutor'?'Teaching dashboard':'Administration dashboard'}<span className="accent">.</span></h1><p className="muted">{role==='Tutor'?'Manage your learning content, follow student progress, and respond to questions.':'Oversee programs, review content, and maintain the quality of the workshop library.'}</p></div><span className="role-badge">{role} account</span></div>
  <div className="stats-grid">{stats.map(stat=><RoleStat key={stat.label} label={stat.label} value={stat.value} icon={stat.icon}/>)}</div>
  <div className="section-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>{role==='Tutor'?'Teaching tools':'Administration tools'}</h2></div></div>
  <div className="staff-dashboard-actions">{actions[role].map(item=><button className="staff-dashboard-action panel" key={item.label} onClick={()=>onNavigate(item.label)}><span className="staff-action-icon"><item.icon size={18}/></span><span className="staff-action-copy"><b>{item.label}</b><small>{item.description}</small></span><span className="staff-action-arrow">→</span></button>)}</div>
  <div className="staff-dashboard-note panel"><span className="staff-note-icon">{role==='Tutor'?<MessageCircle size={17}/>:<ShieldCheck size={17}/>}</span><div><b>{role==='Tutor'?'Your work stays in review until approved':'Approval queue overview'}</b><p>{role==='Tutor'?`${pendingModules} module revisions and ${submissions.filter(s=>s.author==='VEW Tutor'&&s.status!=='Published').length} content submissions are waiting for review.`:`${pendingSubmissions+pendingModules} content items need review. Published learning content stays available to enrolled students.`}</p></div><button className="button subtle" onClick={()=>onNavigate(role==='Tutor'?'Tutor Messages':'Reviews & Approvals')}>{role==='Tutor'?'Open messages':'Review queue'}</button></div>
 </div>;
}
function RoleStat({label,value,icon:Icon}:{label:string;value:number;icon:typeof BookOpen}){return <div className="stat-card panel"><div className="stat-icon"><Icon size={17}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}<span>records</span></div><div className="stat-hint"><span className="trend">↗</span>Current workspace</div></div>}
