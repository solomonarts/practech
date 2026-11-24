import type { EngineeringDiscipline } from '../content/library';
import { uid } from '../content/library';

export type EnrollmentState='Active'|'Completed';
export type ProgramEnrollment={id:string;discipline:EngineeringDiscipline;state:EnrollmentState;enrolledAt:string;completedAt?:string;certificateId?:string;completedLessons:string[];sessionGrades:Record<string,number>};
export type LessonRecord={id:string;title:string;body:string;exerciseId?:string;modelIds?:string[]};
export type ModuleRecord={id:string;discipline:EngineeringDiscipline;title:string;description:string;level:string;lessons:LessonRecord[];status:'Draft'|'Pending Review'|'Published'|'Revision Requested'|'Rejected'|'Archived';author:string;version:number;updatedAt:string;reviewNote?:string;supersedes?:string};
export type TutorInteraction={id:string;student:string;discipline:EngineeringDiscipline;subject:string;message:string;reply:string;status:'Open'|'Answered';createdAt:string;repliedAt?:string};
export type CertificateRecord={id:string;student:string;discipline:EngineeringDiscipline;issuedAt:string;programName:string;modulesCompleted:number;grade:number};

export const programDisciplines:EngineeringDiscipline[]=['Mechanical','Electrical','Civil','Mechatronics'];
const exerciseIds=[['VEW-E-002','VEW-E-003'],['VEW-E-007','VEW-E-008'],['VEW-E-013','VEW-E-014'],['VEW-E-019','VEW-E-020']];
const titles=[['Engine systems','Cooling system service'],['Circuit fundamentals','Electrical safety and measurement'],['Structural members','Load and deformation'],['Pneumatic systems','Automation and actuation']];
export const seededModules:ModuleRecord[]=programDisciplines.flatMap((discipline,index)=>titles[index].map((title,j)=>({id:`MOD-${index+1}${j+1}`,discipline,title,description:`${title} · ${discipline} engineering learning module.`,level:j===0?'Secondary':'Vocational',lessons:[{id:`LESSON-${index+1}${j+1}-A`,title:'Core concepts',body:`Explore the essential concepts, terminology and system structure for ${title.toLowerCase()}.`,exerciseId:exerciseIds[index][j]},{id:`LESSON-${index+1}${j+1}-B`,title:'Workshop preparation',body:'Review the safety notes, tools and practical objectives before entering the workshop.',exerciseId:exerciseIds[index][1-j]}],status:'Published' as const,author:'VEW Learning Team',version:1,updatedAt:'2026-11-09'})));
const read=<T,>(key:string,fallback:T):T=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}};
export const loadEnrollments=()=>read<ProgramEnrollment[]>('vew-enrollments-v1',[]);
export const saveEnrollments=(rows:ProgramEnrollment[])=>localStorage.setItem('vew-enrollments-v1',JSON.stringify(rows));
export const loadModules=()=>read<ModuleRecord[]>('vew-modules-v1',seededModules);
export const saveModules=(rows:ModuleRecord[])=>localStorage.setItem('vew-modules-v1',JSON.stringify(rows));
export const loadInteractions=()=>read<TutorInteraction[]>('vew-tutor-interactions-v1',[]);
export const saveInteractions=(rows:TutorInteraction[])=>localStorage.setItem('vew-tutor-interactions-v1',JSON.stringify(rows));
export const loadCertificates=()=>read<CertificateRecord[]>('vew-certificates-v1',[]);
export const saveCertificates=(rows:CertificateRecord[])=>localStorage.setItem('vew-certificates-v1',JSON.stringify(rows));
export const newEnrollment=(discipline:EngineeringDiscipline):ProgramEnrollment=>({id:uid('ENR'),discipline,state:'Active',enrolledAt:new Date().toISOString(),completedLessons:[],sessionGrades:{}});
