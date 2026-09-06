import {
  auth,
  db,
  getDB,
  saveDB,
  saveSettings,
  saveUserProfile,
  esc,
  initials,
  uid,
  logout,
  protect
} from "./app.js";

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as secondarySignOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


/* =========================
   ADMIN PROTECTION
========================= */

const session = await protect("admin");

if (session) {

  let dbData = await getDB();


  /* =========================
     NAVIGATION
  ========================= */

  const views = document.querySelectorAll(".view");

  document.querySelectorAll(".nav").forEach(n => {

    n.onclick = () => {

      document
        .querySelectorAll(".nav")
        .forEach(x => x.classList.remove("active"));

      n.classList.add("active");

      views.forEach(v => v.classList.add("hidden"));

      const target = document.querySelector("#" + n.dataset.view);

      if (target) {
        target.classList.remove("hidden");
      }

      if (typeof pageTitle !== "undefined") {
        pageTitle.textContent = n.textContent;
      }

      renderAll();
    };

  });


  /* =========================
     RENDER EVERYTHING
  ========================= */

  async function renderAll() {

    dbData = await getDB();


    /* ---------- COUNTS ---------- */

    const branchCount =
      Object.keys(dbData.branches || {}).length;

    const academyCount =
      Object.keys(dbData.academies || {}).length;


    stats.innerHTML = [
      [
        "Students",
        (dbData.students || []).length
      ],
      [
        "Coaches",
        (dbData.coaches || []).length
      ],
      [
        "Branches",
        branchCount
      ],
      [
        "Academies",
        academyCount
      ]
    ]
      .map(x =>
        `
        <div class="stat">
          <span>${x[0]}</span>
          <strong>${x[1]}</strong>
        </div>
        `
      )
      .join("");


    /* ---------- RECENT STUDENTS ---------- */

    recentStudents.innerHTML =
      studentRows(
        (dbData.students || [])
          .slice(-5)
          .reverse()
      );


    /* ---------- ALL STUDENTS ---------- */

    studentsTable.innerHTML =
      studentRows(dbData.students || []);


    /* ---------- COACHES ---------- */

    coachesTable.innerHTML =
      coachRows();


    /* ---------- BRANCHES ---------- */

    branchesList.innerHTML =
      Object.entries(dbData.branches || {})
        .map(([key, value]) =>
          `
          <div class="record">
            <b>${esc(value)}</b>

            <button
              class="mini"
              onclick="removeBranch('${key}')">
              Remove
            </button>
          </div>
          `
        )
        .join("")
      ||
      '<div class="empty">No branches</div>';


    /* ---------- ACADEMIES ---------- */

    academiesList.innerHTML =
      Object.entries(dbData.academies || {})
        .map(([key, value]) =>
          `
          <div class="record">
            <b>${esc(value)}</b>

            <button
              class="mini"
              onclick="removeAcademy('${key}')">
              Remove
            </button>
          </div>
          `
        )
        .join("")
      ||
      '<div class="empty">No academies</div>';
  }


  /* =========================
     STUDENT TABLE
  ========================= */

  function studentRows(list) {

    if (!list.length) {
      return '<div class="empty">No students found.</div>';
    }

    return `
      <table class="table">

        <thead>
          <tr>
            <th>Student</th>
            <th>ID</th>
            <th>Branch</th>
            <th>Academy</th>
            <th>Belt</th>
            <th>Coach</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          ${list.map(s => {

            const c =
              (dbData.coaches || [])
                .find(
                  x =>
                    x.id === s.coachId ||
                    x.uid === s.coachId
                );

            return `
              <tr>

                <td>
                  <div class="person">

                    <div class="avatar">

                      ${
                        s.photo
                          ? `<img
                              class="avatar"
                              src="${esc(s.photo)}"
                              alt="">`
                          : initials(s.name)
                      }

                    </div>

                    <b>${esc(s.name)}</b>

                  </div>
                </td>


                <td>
                  ${esc(s.studentId)}
                </td>


                <td>
                  ${esc(s.branch)}
                </td>


                <td>
                  ${esc(s.academy)}
                </td>


                <td>
                  ${esc(s.belt || "White")}
                </td>


                <td>
                  ${esc(c?.name || "Unassigned")}
                </td>


                <td>

                  <div class="action-row">

                    <button
                      class="mini"
                      onclick="editStudent('${esc(s.id)}')">
                      Edit
                    </button>

                    <button
                      class="mini"
                      onclick="openCard('${esc(s.studentId)}')">
                      ID Card
                    </button>

                  </div>

                </td>

              </tr>
            `;

          }).join("")}

        </tbody>

      </table>
    `;
  }


  /* =========================
     COACH TABLE
  ========================= */

  function coachRows() {

    if (!(dbData.coaches || []).length) {
      return '<div class="empty">No coaches.</div>';
    }

    return `
      <table class="table">

        <thead>

          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Students</th>
          </tr>

        </thead>

        <tbody>

          ${
            dbData.coaches
              .map(c => {

                const studentCount =
                  (dbData.students || [])
                    .filter(
                      s =>
                        s.coachId === c.id ||
                        s.coachId === c.uid
                    )
                    .length;

                return `
                  <tr>

                    <td>
                      ${esc(c.name)}
                    </td>

                    <td>
                      ${esc(c.email)}
                    </td>

                    <td>
                      ${studentCount}
                    </td>

                  </tr>
                `;

              })
              .join("")
          }

        </tbody>

      </table>
    `;
  }


  /* =========================
     EDIT STUDENT
  ========================= */

  window.editStudent = async id => {

    const d = await getDB();

    const s =
      (d.students || [])
        .find(x => x.id === id);

    if (!s) {
      alert("Student not found.");
      return;
    }


    modal.classList.remove("hidden");


    modal.innerHTML = `
      <div class="modal-box">

        <div class="modal-head">

          <h2>Edit Student</h2>

          <button
            class="modal-close"
            onclick="closeModal()">
            ×
          </button>

        </div>


        <form
          id="editForm"
          class="form-card">


          <!-- NAME -->

          <label>
            Name

            <input
              id="eName"
              value="${esc(s.name)}"
              required>
          </label>


          <!-- BRANCH -->

          <label>
            Branch

            <select id="eBranch">

              ${
                Object.entries(d.branches || {})
                  .map(([key, value]) =>
                    `
                    <option
                      value="${esc(value)}"
                      ${
                        value === s.branch
                          ? "selected"
                          : ""
                      }>

                      ${esc(value)}

                    </option>
                    `
                  )
                  .join("")
              }

            </select>

          </label>


          <!-- ACADEMY -->

          <label>
            Academy

            <select id="eAcademy">

              ${
                Object.entries(d.academies || {})
                  .map(([key, value]) =>
                    `
                    <option
                      value="${esc(value)}"
                      ${
                        value === s.academy
                          ? "selected"
                          : ""
                      }>

                      ${esc(value)}

                    </option>
                    `
                  )
                  .join("")
              }

            </select>

          </label>


          <!-- COACH -->

          <label>
            Coach

            <select id="eCoach">

              <option value="">
                Unassigned
              </option>

              ${
                (d.coaches || [])
                  .map(c => {

                    const coachId =
                      c.uid || c.id;

                    return `
                      <option
                        value="${esc(coachId)}"
                        ${
                          coachId === s.coachId
                            ? "selected"
                            : ""
                        }>

                        ${esc(c.name)}

                      </option>
                    `;

                  })
                  .join("")
              }

            </select>

          </label>


          <!-- BELT -->

          <label>
            Belt

            <select id="eBelt">

              ${
                [
                  "White",
                  "Yellow",
                  "Green",
                  "Blue",
                  "Red",
                  "Black"
                ]
                  .map(x =>
                    `
                    <option
                      ${
                        x === s.belt
                          ? "selected"
                          : ""
                      }>

                      ${x}

                    </option>
                    `
                  )
                  .join("")
              }

            </select>

          </label>


          <button
            class="btn primary"
            type="submit">

            Save Changes

          </button>


        </form>

      </div>
    `;


    /* ---------- SAVE STUDENT ---------- */

    editForm.onsubmit = async e => {

      e.preventDefault();


      try {

        const d2 = await getDB();

        const x =
          (d2.students || [])
            .find(z => z.id === id);

        if (!x) {
          alert("Student not found.");
          return;
        }


        Object.assign(x, {

          name:
            eName.value.trim(),

          branch:
            eBranch.value,

          academy:
            eAcademy.value,

          coachId:
            eCoach.value,

          belt:
            eBelt.value

        });


        await saveDB(d2);

        closeModal();

        await renderAll();

        alert("Student updated successfully.");

      } catch (err) {

        console.error(err);

        alert(
          "Could not update student: " +
          err.message
        );

      }

    };

  };


  /* =========================
     CLOSE MODAL
  ========================= */

  window.closeModal = () => {

    modal.classList.add("hidden");

    modal.innerHTML = "";

  };


  /* =========================
     OPEN ID CARD
  ========================= */

  window.openCard = id => {

    window.open(
      "id-card.html?id=" +
      encodeURIComponent(id),
      "_blank"
    );

  };


  /* =========================
     ADD COACH
  ========================= */

  addCoach.onclick = async () => {

    modal.classList.remove("hidden");


    modal.innerHTML = `
      <div class="modal-box">

        <div class="modal-head">

          <h2>Add Coach</h2>

          <button
            class="modal-close"
            onclick="closeModal()">
            ×
          </button>

        </div>


        <form
          id="coachForm"
          class="form-card">


          <label>
            Name

            <input
              id="cName"
              required>
          </label>


          <label>
            Email

            <input
              id="cEmail"
              type="email"
              required>
          </label>


          <label>
            Password

            <input
              id="cPass"
              type="password"
              minlength="6"
              required>
          </label>


          <button
            class="btn primary"
            type="submit">

            Create Coach Account

          </button>


          <p class="muted small">
            The coach will sign in with
            Firebase Authentication.
          </p>


        </form>

      </div>
    `;


    coachForm.onsubmit = async e => {

      e.preventDefault();


      try {

        /*
         * Create coach using secondary
         * Firebase Authentication app.
         */

        const app =
          getApps().find(
            a => a.name === "coachCreator"
          ) ||
          initializeApp(
            firebaseConfig,
            "coachCreator"
          );


        const a = getAuth(app);


        const cred =
          await createUserWithEmailAndPassword(
            a,
            cEmail.value
              .trim()
              .toLowerCase(),
            cPass.value
          );


        const d = await getDB();


        /* ---------- COACH ---------- */

        d.coaches = [
          ...(d.coaches || []),

          {
            id: cred.user.uid,
            uid: cred.user.uid,
            name: cName.value.trim(),
            email: cEmail.value
              .trim()
              .toLowerCase()
          }

        ];


        /* ---------- USER PROFILE ---------- */

        d.users = {

          ...(d.users || {}),

          [cred.user.uid]: {

            uid: cred.user.uid,

            role: "coach",

            name: cName.value.trim(),

            email: cEmail.value
              .trim()
              .toLowerCase()

          }

        };


        await saveDB(d);


        await saveUserProfile(
          cred.user.uid,
          {
            uid: cred.user.uid,
            role: "coach",
            name: cName.value.trim(),
            email: cEmail.value
              .trim()
              .toLowerCase()
          }
        );


        await secondarySignOut(a);


        closeModal();

        await renderAll();


        alert(
          "Coach account created successfully."
        );


      } catch (err) {

        console.error(err);

        alert(
          "Could not create coach: " +
          err.message
        );

      }

    };

  };


  /* =========================
     ADD BRANCH
  ========================= */

  addBranch.onclick = () =>
    addItem("branch");


  /* =========================
     ADD ACADEMY
  ========================= */

  addAcademy.onclick = () =>
    addItem("academy");


  /* =========================
     ADD BRANCH / ACADEMY
  ========================= */

  async function addItem(type) {

    const label =
      type === "branch"
        ? "Branch"
        : "Academy";


    const value =
      prompt(
        "Enter " +
        label +
        " name"
      );


    if (
      !value ||
      !value.trim()
    ) {
      return;
    }


    const d = await getDB();

    const name =
      value.trim();


    /* =========================
       BRANCH
    ========================= */

    if (type === "branch") {

      const branches =
        d.branches || {};


      const exists =
        Object.values(branches)
          .some(
            x =>
              String(x)
                .toLowerCase() ===
              name.toLowerCase()
          );


      if (exists) {

        alert(
          "This branch already exists."
        );

        return;
      }


      const key =
        "b_" + Date.now();


      branches[key] =
        name;


      d.branches =
        branches;

    }


    /* =========================
       ACADEMY
    ========================= */

    else {

      const academies =
        d.academies || {};


      const exists =
        Object.values(academies)
          .some(
            x =>
              String(x)
                .toLowerCase() ===
              name.toLowerCase()
          );


      if (exists) {

        alert(
          "This academy already exists."
        );

        return;
      }


      const key =
        "a_" + Date.now();


      academies[key] =
        name;


      d.academies =
        academies;

    }


    /* =========================
       SAVE
    ========================= */

    try {

      await saveSettings(d);


      alert(
        label +
        " added successfully."
      );


      await renderAll();


    } catch (err) {

      console.error(err);


      alert(
        "Could not save " +
        label +
        ": " +
        err.message
      );

    }

  }


  /* =========================
     REMOVE BRANCH
  ========================= */

  window.removeBranch =
    async function(key) {

      const d =
        await getDB();


      if (
        !confirm(
          "Remove this branch?"
        )
      ) {
        return;
      }


      if (
        d.branches &&
        d.branches[key]
      ) {

        delete d.branches[key];

      }


      try {

        await saveSettings(d);

        await renderAll();


      } catch (err) {

        console.error(err);

        alert(
          "Could not remove branch: " +
          err.message
        );

      }

    };


  /* =========================
     REMOVE ACADEMY
  ========================= */

  window.removeAcademy =
    async function(key) {

      const d =
        await getDB();


      if (
        !confirm(
          "Remove this academy?"
        )
      ) {
        return;
      }


      if (
        d.academies &&
        d.academies[key]
      ) {

        delete d.academies[key];

      }


      try {

        await saveSettings(d);

        await renderAll();


      } catch (err) {

        console.error(err);

        alert(
          "Could not remove academy: " +
          err.message
        );

      }

    };


  /* =========================
     STUDENT SEARCH
  ========================= */

  if (typeof studentSearch !== "undefined") {

    studentSearch.oninput =
      async () => {

        const q =
          studentSearch.value
            .toLowerCase()
            .trim();


        const d =
          await getDB();


        studentsTable.innerHTML =
          studentRows(

            (d.students || [])
              .filter(s =>
                (
                  (s.name || "") +
                  (s.studentId || "") +
                  (s.branch || "") +
                  (s.academy || "")
                )
                  .toLowerCase()
                  .includes(q)
              )

          );

      };

  }


  /* =========================
     INITIAL LOAD
  ========================= */

  await renderAll();

}
