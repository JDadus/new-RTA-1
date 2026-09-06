import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

export const firebaseConfig={apiKey:"AIzaSyA25e134MNAh0zWcPDnmVxzb7L5xc6xrhY",authDomain:"rta-175e5.firebaseapp.com",databaseURL:"https://rta-175e5-default-rtdb.firebaseio.com",projectId:"rta-175e5",storageBucket:"rta-175e5.firebasestorage.app",messagingSenderId:"395650619398",appId:"1:395650619398:web:43763074002d93664f8b87",measurementId:"G-NZ8EQF4DWY"};
const app=initializeApp(firebaseConfig);
let analytics=null; try{analytics=getAnalytics(app)}catch(e){console.warn("Firebase Analytics unavailable in this environment",e)}
export const auth=getAuth(app); export const db=getDatabase(app); export const storage=getStorage(app); export {app,analytics};
