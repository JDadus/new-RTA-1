import {auth,db,storage} from "./firebase.js";
import {ref,get,set,update,query,orderByChild,equalTo} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import {ref as storageRef,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import {onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
export {auth,db,storage};
export function uid(){return crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)}
const defaults={branches:{b1:"Panvel",b2:"Navi Mumbai",b3:"Alibag"},academies:{a1:"RTA Main Academy",a2:"Raigad Martial Arts Academy"},settings:{year:new Date().getFullYear(),nextStudentNumber:1}};
export async function getDB(){
  // The landing page is loaded before a user is authenticated. Firebase rules
  // intentionally block anonymous reads of users/students/coaches, so do not
  // let those reads prevent the login/register UI from initializing.
  const safeGet=async path=>{try{return await get(ref(db,path))}catch(e){console.warn(`Firebase read blocked for ${path}`,e);return null}};
  const [s,u,c,st]=await Promise.all([safeGet("students"),safeGet("users"),safeGet("coaches"),safeGet("settings")]);
  const settings=st?.exists()?st.val():defaults.settings;
  return{branches:settings.branches||defaults.branches,academies:settings.academies||defaults.academies,settings,students:s?.exists()?Object.values(s.val()):[],users:u?.exists()?u.val():{},coaches:c?.exists()?Object.values(c.val()):[]};
}
export async function saveStudent(s){await set(ref(db,`students/${s.uid||s.id}`),s)}
export async function saveCoach(c){await set(ref(db,`coaches/${c.uid||c.id}`),c)}
export async function saveDB(d){for(const s of d.students||[])await saveStudent(s);for(const c of d.coaches||[])await saveCoach(c);return d}
export async function saveSettings(d){
  await set(ref(db,"settings"),
            {...(d.settings||{}),
                                branches:d.branches||{},
                                academies:d.academies||{}})}
export async function getUserProfile(id) {
  // Check admin first
  const adminSnap = await get(
    ref(db, `admin/${id}`)
  );
  if (adminSnap.exists()) {
    return {
      uid: id,
      ...adminSnap.val(),
      role: "admin"
    };
  }
  // Check normal user profile
  const userSnap = await get(
    ref(db, `users/${id}`)
  );
  if (userSnap.exists()) {
    return userSnap.val();
  }
  return null;
}
export async function saveUserProfile(id,data){await update(ref(db,`users/${id}`),data)}
export function getSession(){return auth.currentUser}
export async function logout()
{
  await signOut(auth);
                               location.href="index.html"}
export async function protect(role){
  return new Promise(resolve=>onAuthStateChanged(auth,async user=>{if(!user){location.href="index.html";return resolve(null)}const p=await getUserProfile(user.uid);if(role&&p?.role!==role){location.href=p?.role?`${p.role}.html`:"index.html";return resolve(null)}resolve({...user,...p})}))}
export function nextStudentId(d){
  const y=new Date().getFullYear(),max=(d.students||[]).reduce((m,s)=>Math.max(m,Number((s.studentId||"").split("-").pop())||0),0);return`RTA-${y}-${String(max+1).padStart(4,"0")}`}
export function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
export function initials(n=""){return n.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
export async function uploadFile(file,path){if(!file)return"";const r=storageRef(storage,path);await uploadBytes(r,file);return await getDownloadURL(r)}
export async function studentById(id){const d=await getDB();return d.students.find(s=>s.uid===id||s.id===id||s.studentId===id)}
export function qrUrl(studentId){return location.href.replace(/[^/]+$/," ").trim()+"profile.html?id="+encodeURIComponent(studentId)}
export function makeQR(el,text){if(!el)return;el.innerHTML="";if(window.QRCode)new QRCode(el,{text,width:130,height:130,correctLevel:QRCode.CorrectLevel.M});else el.textContent="QR"}
document.querySelector("#logout")?.addEventListener("click",logout);
