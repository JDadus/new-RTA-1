import {auth,db,getDB,saveDB,saveSettings,saveUserProfile,esc,initials,uid,logout,protect} from "./app.js";
import {initializeApp,getApps} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,createUserWithEmailAndPassword,signOut as secondarySignOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const session=await protect("admin");
if(session){let dbData=await getDB();
            const views=document.querySelectorAll(".view");document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
                                                                                                                                                n.classList.add("active");
                                                                                                                                                views.forEach(v=>v.classList.add("hidden"));document.querySelector("#"+n.dataset.view).classList.remove("hidden");
                                                                                                                                                pageTitle.textContent=n.textContent;renderAll()});
async function renderAll(){dbData=await getDB();stats.innerHTML=[["Students",(dbData.students||[]).length],["Coaches",(dbData.coaches||[]).length],["Branches",(dbData.branches||[]).length],["Academies",(dbData.academies||[]).length]].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");recentStudents.innerHTML=studentRows((dbData.students||[]).slice(-5).reverse());studentsTable.innerHTML=studentRows(dbData.students||[]);coachesTable.innerHTML=coachRows();branchesList.innerHTML=(dbData.branches||[]).map((x,i)=>`<div class="record"><b>${esc(x)}</b> <button class="mini" onclick="removeBranch(${i})">Remove</button></div>`).join("")||'<div class="empty">No branches</div>';academiesList.innerHTML=(dbData.academies||[]).map((x,i)=>`<div class="record"><b>${esc(x)}</b> <button class="mini" onclick="removeAcademy(${i})">Remove</button></div>`).join("")||'<div class="empty">No academies</div>'}
function studentRows(list){if(!list.length)return'<div class="empty">No students found.</div>';return`<table class="table"><thead><tr><th>Student</th><th>ID</th><th>Branch</th><th>Academy</th><th>Belt</th><th>Coach</th><th>Action</th></tr></thead><tbody>${list.map(s=>{let c=(dbData.coaches||[]).find(x=>x.id===s.coachId||x.uid===s.coachId);return`<tr><td><div class="person"><div class="avatar">${s.photo?`<img class="avatar" src="${s.photo}">`:initials(s.name)}</div>
<b>${esc(s.name)}</b></div></td><td>${esc(s.studentId)}</td><td>${esc(s.branch)}</td><td>${esc(s.academy)}</td><td>${esc(s.belt||"White")}</td><td>${esc(c?.name||"Unassigned")}</td>
<td><div class="action-row"><button class="mini" onclick="editStudent('${s.id}')">Edit</button><button class="mini" onclick="openCard('${s.studentId}')">ID Card</button></div></td></tr>`}).join("")}</tbody></table>`}
function coachRows(){if(!(dbData.coaches||[]).length)return'<div class="empty">No coaches.</div>';return`<table class="table"><thead><tr><th>Name</th><th>Email</th><th>Students</th></tr></thead><tbody>${dbData.coaches.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>${(dbData.students||[]).filter(s=>s.coachId===c.id||s.coachId===c.uid).length}</td></tr>`).join("")}</tbody></table>`}
window.editStudent=async id=>{let s=(await getDB()).students.find(x=>x.id===id),d=await getDB();modal.classList.remove("hidden");modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>Edit Student</h2><button class="modal-close" onclick="closeModal()">×</button></div><form id="editForm" class="form-card"><label>Name<input id="eName" value="${esc(s.name)}" required></label><label>Branch<select id="eBranch">${(d.branches||[]).map(x=>`<option ${x===s.branch?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label>Academy<select id="eAcademy">${(d.academies||[]).map(x=>`<option ${x===s.academy?"selected":""}>${esc(x)}</option>`).join("")}</select></label><label>Coach<select id="eCoach"><option value="">Unassigned</option>${(d.coaches||[]).map(c=>`<option value="${c.uid||c.id}" ${(c.uid||c.id)===s.coachId?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label><label>Belt<select id="eBelt">${["White","Yellow","Green","Blue","Red","Black"].map(x=>`<option ${x===s.belt?"selected":""}>${x}</option>`).join("")}</select></label><button class="btn primary">Save Changes</button></form></div>`;editForm.onsubmit=async e=>{e.preventDefault();let d2=await getDB(),x=d2.students.find(z=>z.id===id);Object.assign(x,{name:eName.value,branch:eBranch.value,academy:eAcademy.value,coachId:eCoach.value,belt:eBelt.value});await saveDB(d2);closeModal();
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          renderAll()}};
window.closeModal=()=>modal.classList.add("hidden");window.openCard=id=>window.open("id-card.html?id="+encodeURIComponent(id),"_blank");
addCoach.onclick=async()=>{modal.classList.remove("hidden");modal.innerHTML=`<div class="modal-box"><div class="modal-head"><h2>Add Coach</h2><button class="modal-close" onclick="closeModal()">×</button></div><form id="coachForm" class="form-card"><label>Name<input id="cName" required></label><label>Email<input id="cEmail" type="email" required></label><label>Password<input id="cPass" minlength="6" required></label><button class="btn primary">Create Coach Account</button><p class="muted small">The coach will sign in with Firebase Authentication.</p></form></div>`;coachForm.onsubmit=async e=>{e.preventDefault();try{const app=getApps().find(a=>a.name==="coachCreator")||initializeApp(firebaseConfig,"coachCreator"),a=getAuth(app),cred=await createUserWithEmailAndPassword(a,cEmail.value.trim().toLowerCase(),cPass.value),d=await getDB();d.coaches=[...(d.coaches||[]),{id:cred.user.uid,uid:cred.user.uid,name:cName.value.trim(),email:cEmail.value.trim().toLowerCase()}];d.users={...(d.users||{}),[cred.user.uid]:{uid:cred.user.uid,role:"coach",name:cName.value.trim(),email:cEmail.value.trim().toLowerCase()}};await saveDB(d);await saveUserProfile(cred.user.uid,{uid:cred.user.uid,role:"coach",name:cName.value.trim(),email:cEmail.value.trim().toLowerCase()});await secondarySignOut(a);closeModal();renderAll()}catch(err){alert(err.message)}}};
addBranch.onclick = () => addItem("branch");
addAcademy.onclick = () => addItem("academy");

async function addItem(type) {
  const label = type === "branch" ? "Branch" : "Academy";
  const value = prompt("Enter " + label + " name");

  if (!value || !value.trim()) return;

  const d = await getDB();
  const name = value.trim();

  if (type === "branch") {
    const branches = d.branches || {};

    const exists = Object.values(branches).some(
      x => String(x).toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("This branch already exists.");
      return;
    }

    const key = "b_" + Date.now();
    branches[key] = name;
    d.branches = branches;

  } else {
    const academies = d.academies || {};

    const exists = Object.values(academies).some(
      x => String(x).toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert("This academy already exists.");
      return;
    }

    const key = "a_" + Date.now();
    academies[key] = name;
    d.academies = academies;
  }

  try {
    await saveSettings(d);
    alert(label + " added successfully.");
    await renderAll();
  } catch (err) {
    console.error(err);
    alert("Could not save " + label + ": " + err.message);
  }
}

window.removeBranch = async function(key) {
  const d = await getDB();

  if (!confirm("Remove this branch?")) return;

  if (d.branches && d.branches[key]) {
    delete d.branches[key];
  }

  await saveSettings(d);
  await renderAll();
};

window.removeAcademy = async function(key) {
  const d = await getDB();

  if (!confirm("Remove this academy?")) return;

  if (d.academies && d.academies[key]) {
    delete d.academies[key];
  }

  await saveSettings(d);
  await renderAll();
};
