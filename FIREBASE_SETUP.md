# RTA Firebase setup

This version is connected to the Firebase project in `js/firebase.js` using Firebase Authentication, Realtime Database and Storage.

## 1. Enable Authentication
Firebase Console → Authentication → Sign-in method → enable **Email/Password**.

## 2. Create the first Admin
Create an Email/Password user in Firebase Authentication. Then add a Realtime Database record:

`users/<ADMIN_UID>`

with:

```json
{
  "uid": "ADMIN_UID",
  "role": "admin",
  "name": "RTA Admin",
  "email": "your-admin-email@example.com"
}
```

The UID must exactly match the Firebase Authentication UID.

## 3. Realtime Database rules
Import/apply `firebase.rules.json` in Realtime Database → Rules.

## 4. Storage rules
For the prototype, enable authenticated uploads/downloads in Firebase Storage. Tighten these rules before production so users can only upload to their own `students/<uid>/...` folder.

## 5. Run the website
Because this uses ES modules and Firebase, open it through a local web server rather than `file://`.
For example, from the `rta_website` folder:

`python -m http.server 5500`

Then open `http://localhost:5500/`.

### What is now Firebase-backed
- Email/password authentication
- Student registration
- Student profiles
- Auto-generated RTA student IDs
- Branch and academy data
- Coach accounts
- Coach-to-student assignment
- Belt updates
- Competition records
- Uploaded photos/certificates via Firebase Storage
- QR-linked public student profiles
