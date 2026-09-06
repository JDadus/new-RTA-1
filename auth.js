import {
    auth,
    db,
    getDB,
    saveStudent,
    nextStudentId,
    esc,
    uploadFile,
    saveUserProfile,
    saveCoach
} from "./app.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
    get,
    ref
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";


// ======================================================
// BRANCH & ACADEMY
// ======================================================

const branchSel = document.querySelector("#regBranch");
const academySel = document.querySelector("#regAcademy");
const coachBranch = document.querySelector("#coachBranch");
const coachAcademy = document.querySelector("#coachAcademy");

const defaultBranches = [
    "Panvel",
    "Navi Mumbai",
    "Alibag"
];

const defaultAcademies = [
    "RTA Main Academy",
    "Raigad Martial Arts Academy"
];

const fill = (el, items) => {
    if (!el) return;

    el.innerHTML = items
        .map(x => `<option value="${esc(x)}">${esc(x)}</option>`)
        .join("");
};

fill(branchSel, defaultBranches);
fill(coachBranch, defaultBranches);
fill(academySel, defaultAcademies);
fill(coachAcademy, defaultAcademies);


// Load branches and academies from Firebase
(async () => {
    try {
        const d = await getDB();

        const branches = Object.values(d.branches || {});
        const academies = Object.values(d.academies || {});

        if (branches.length) {
            fill(branchSel, branches);
            fill(coachBranch, branches);
        }

        if (academies.length) {
            fill(academySel, academies);
            fill(coachAcademy, academies);
        }

    } catch (e) {
        console.warn(
            "Could not load branch/academy data:",
            e
        );
    }
})();


// ======================================================
// LOGIN / REGISTER ROLE
// ======================================================

let loginRole = "student";
let registerRole = "student";

const loginSubmit = document.querySelector("#loginSubmit");

const setLoginRole = role => {

    loginRole = role;

    document
        .querySelectorAll("[data-role]")
        .forEach(x => {
            x.classList.toggle(
                "active",
                x.dataset.role === role
            );
        });

    if (loginSubmit) {
        loginSubmit.textContent =
            `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    }
};


const setRegisterRole = role => {

    registerRole = role;

    document
        .querySelectorAll("[data-register-role]")
        .forEach(x => {
            x.classList.toggle(
                "active",
                x.dataset.registerRole === role
            );
        });

    const studentForm =
        document.querySelector("#studentRegisterForm");

    const coachForm =
        document.querySelector("#coachRegisterForm");

    if (studentForm) {
        studentForm.classList.toggle(
            "hidden",
            role !== "student"
        );
    }

    if (coachForm) {
        coachForm.classList.toggle(
            "hidden",
            role !== "coach"
        );
    }
};


// Login role buttons
document
    .querySelectorAll("[data-role]")
    .forEach(button => {

        button.onclick = () => {
            setLoginRole(button.dataset.role);
        };

    });


// Registration role buttons
document
    .querySelectorAll("[data-register-role]")
    .forEach(button => {

        button.onclick = () => {
            setRegisterRole(
                button.dataset.registerRole
            );
        };

    });


// ======================================================
// LOGIN / CREATE NEW TABS
// ======================================================

document
    .querySelectorAll(".tab")
    .forEach(button => {

        button.onclick = () => {

            document
                .querySelectorAll(".tab")
                .forEach(x =>
                    x.classList.remove("active")
                );

            button.classList.add("active");

            const loginForm =
                document.querySelector("#loginForm");

            const registerForm =
                document.querySelector("#registerForm");

            if (loginForm) {
                loginForm.classList.toggle(
                    "hidden",
                    button.dataset.tab !== "login"
                );
            }

            if (registerForm) {
                registerForm.classList.toggle(
                    "hidden",
                    button.dataset.tab !== "register"
                );
            }

        };

    });


// ======================================================
// GO TO CORRECT DASHBOARD
// ======================================================

const goByRole = user => {

    if (user.role === "admin") {
        location.href = "admin.html";
        return;
    }

    if (user.role === "coach") {
        location.href = "coach.html";
        return;
    }

    if (user.role === "student") {
        location.href = "student.html";
        return;
    }

    throw new Error("Unknown RTA account role.");
};


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.querySelector("#loginInnerForm");

if (loginForm) {

    loginForm.onsubmit = async e => {

        e.preventDefault();

        const loginMsg =
            document.querySelector("#loginMsg");

        const loginEmail =
            document.querySelector("#loginEmail");

        const loginPassword =
            document.querySelector("#loginPassword");


        if (!loginEmail || !loginPassword) {
            console.error(
                "Login email/password fields were not found."
            );

            return;
        }


        loginMsg.textContent = "Signing in…";
        loginMsg.className = "message";


        try {

            // ------------------------------------------
            // 1. Firebase Authentication
            // ------------------------------------------

            const email =
                loginEmail.value.trim().toLowerCase();

            const password =
                loginPassword.value;


            const cred =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const uid =
                cred.user.uid;


            // ------------------------------------------
            // 2. Check RTA database role
            // ------------------------------------------

            /*
                YOUR FIREBASE STRUCTURE:

                admin/{UID}
                coaches/{UID}
                students/{UID}
            */


            const [
                adminSnap,
                coachSnap,
                studentSnap
            ] = await Promise.all([

                get(
                    ref(
                        db,
                        `admin/${uid}`
                    )
                ),

                get(
                    ref(
                        db,
                        `coaches/${uid}`
                    )
                ),

                get(
                    ref(
                        db,
                        `students/${uid}`
                    )
                )

            ]);


            let user = null;


            // ------------------------------------------
            // ADMIN
            // ------------------------------------------

            if (adminSnap.exists()) {

                user = {
                    ...adminSnap.val(),
                    uid: uid,
                    role: "admin"
                };

            }


            // ------------------------------------------
            // COACH
            // ------------------------------------------

            else if (coachSnap.exists()) {

                user = {
                    ...coachSnap.val(),
                    uid: uid,
                    role: "coach"
                };

            }


            // ------------------------------------------
            // STUDENT
            // ------------------------------------------

            else if (studentSnap.exists()) {

                user = {
                    ...studentSnap.val(),
                    uid: uid,
                    role: "student"
                };

            }


            // ------------------------------------------
            // NO PROFILE
            // ------------------------------------------

            if (!user) {

                throw new Error(
                    "This Firebase account has no RTA profile."
                );

            }


            // ------------------------------------------
            // CHECK SELECTED LOGIN TYPE
            // ------------------------------------------

            if (loginRole !== user.role) {

                throw new Error(
                    `This account is registered as ${user.role}. Please choose ${user.role} Login.`
                );

            }


            // ------------------------------------------
            // OPEN DASHBOARD
            // ------------------------------------------

            goByRole(user);

        }


        catch (err) {

            console.error(
                "RTA Login Error:",
                err
            );


            if (
                err.code === "auth/invalid-credential" ||
                err.code === "auth/wrong-password" ||
                err.code === "auth/user-not-found"
            ) {

                loginMsg.textContent =
                    "Invalid email or password.";

            }

            else {

                loginMsg.textContent =
                    err.message || "Login failed.";

            }

            loginMsg.className =
                "message danger";

        }

    };

}


// ======================================================
// STUDENT REGISTRATION
// ======================================================

const studentRegisterForm =
    document.querySelector("#studentRegisterForm");

if (studentRegisterForm) {

    studentRegisterForm.onsubmit = async e => {

        e.preventDefault();

        const regMsg =
            document.querySelector("#regMsg");

        regMsg.textContent =
            "Creating student account…";

        regMsg.className =
            "message";


        try {

            const regEmail =
                document.querySelector("#regEmail");

            const regPassword =
                document.querySelector("#regPassword");

            const regName =
                document.querySelector("#regName");

            const regDob =
                document.querySelector("#regDob");

            const regMobile =
                document.querySelector("#regMobile");

            const regBranch =
                document.querySelector("#regBranch");

            const regAcademy =
                document.querySelector("#regAcademy");

            const regPhoto =
                document.querySelector("#regPhoto");


            const email =
                regEmail.value.trim().toLowerCase();


            // Firebase Authentication
            const cred =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    regPassword.value
                );


            const dbData =
                await getDB();


            const sid =
                nextStudentId(dbData);


            let photo = "";

            if (
                regPhoto &&
                regPhoto.files &&
                regPhoto.files[0]
            ) {

                photo = await uploadFile(
                    regPhoto.files[0],
                    `students/${cred.user.uid}/photo`
                );

            }


            const student = {

                id: cred.user.uid,

                uid: cred.user.uid,

                studentId: sid,

                name:
                    regName.value.trim(),

                dob:
                    regDob.value,

                mobile:
                    regMobile.value.trim(),

                email,

                branch:
                    regBranch.value,

                academy:
                    regAcademy.value,

                coachId: "",

                photo,

                belt: "White",

                beltProof: "",

                competitions: [],

                createdAt:
                    new Date().toISOString()

            };


            // Save student profile
            await saveStudent(student);


            // Save common user profile
            await saveUserProfile(
                cred.user.uid,
                {
                    uid: cred.user.uid,
                    role: "student",
                    name: student.name,
                    email,
                    studentId: sid
                }
            );


            location.href =
                "student.html";

        }


        catch (err) {

            console.error(
                "Student registration error:",
                err
            );

            regMsg.textContent =
                err.message ||
                "Student registration failed.";

            regMsg.className =
                "message danger";

        }

    };

}


// ======================================================
// COACH REGISTRATION
// ======================================================

const coachRegisterForm =
    document.querySelector("#coachRegisterForm");

if (coachRegisterForm) {

    coachRegisterForm.onsubmit = async e => {

        e.preventDefault();

        const coachMsg =
            document.querySelector("#coachMsg");

        coachMsg.textContent =
            "Creating coach account…";

        coachMsg.className =
            "message";


        try {

            const coachEmail =
                document.querySelector("#coachEmail");

            const coachPassword =
                document.querySelector("#coachPassword");

            const coachName =
                document.querySelector("#coachName");

            const coachMobile =
                document.querySelector("#coachMobile");

            const coachBranch =
                document.querySelector("#coachBranch");

            const coachAcademy =
                document.querySelector("#coachAcademy");


            const email =
                coachEmail.value.trim().toLowerCase();


            // Firebase Authentication
            const cred =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    coachPassword.value
                );


            const coach = {

                id: cred.user.uid,

                uid: cred.user.uid,

                name:
                    coachName.value.trim(),

                mobile:
                    coachMobile.value.trim(),

                email,

                branch:
                    coachBranch.value,

                academy:
                    coachAcademy.value,

                createdAt:
                    new Date().toISOString()

            };


            // Save coach profile
            await saveCoach(coach);


            // Save common user profile
            await saveUserProfile(
                cred.user.uid,
                {
                    uid: cred.user.uid,
                    role: "coach",
                    name: coach.name,
                    email,
                    branch: coach.branch,
                    academy: coach.academy
                }
            );


            location.href =
                "coach.html";

        }


        catch (err) {

            console.error(
                "Coach registration error:",
                err
            );

            coachMsg.textContent =
                err.message ||
                "Coach registration failed.";

            coachMsg.className =
                "message danger";

        }

    };

}


// ======================================================
// DEFAULT LOGIN ROLE
// ======================================================

setLoginRole("student");
setRegisterRole("student");
