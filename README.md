# Synagogue Board — GitHub Pages + Firebase Ready

## What this project includes
- `index.html` — the public full-screen synagogue display.
- `admin.html` — phone-friendly administration page.
- Automatic time, Hebrew date, parashah, zmanim, candle lighting, Havdalah and upcoming fast.
- Editable synagogue name, rabbi, dedication, announcements and prayer schedule.
- GitHub Pages hosting.
- Optional Firebase Realtime Database for remote updates across multiple TVs/devices.
- Local fallback when Firebase is not configured.

## Publish on GitHub Pages
1. Create a new GitHub repository.
2. Upload every file from this folder.
3. Open the repository's **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, select:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
6. Save.
7. GitHub will provide a website address.

The display page will be:
`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

The administrator page will be:
`https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html`

## Enable remote cloud updates with Firebase
1. Create a Firebase project.
2. Enable Realtime Database.
3. Create a Web App in Firebase.
4. Copy the Firebase settings into `config.js`.
5. Set a unique `boardId` for each synagogue.

Example:
```js
window.APP_CONFIG = {
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  boardId: "shaarei-zion"
};
```

## Important security note
The included version is a working starter. Before public commercial use, protect Firebase writes with Firebase Authentication and secure database rules. Without authentication, anyone who knows the database endpoint may be able to write data, depending on your Firebase rules.

## Multiple synagogues
Duplicate the repository or change `boardId` for each display:
- `shaarei-zion`
- `beth-el`
- `chabad-main`

Each ID stores separate settings in Firebase.
