# Synagogue Board — GitHub Pages + Firebase Ready

## Included fixes
- New York / Eastern time and date using `America/New_York`.
- Automatic Hebrew date, weekly parashah, zmanim, candle lighting, Havdalah and next fast through Hebcal.
- Working play/pause button. When `musicUrl` is blank, the board plays a built-in gentle melody; an MP3 URL or local `music.mp3` can also be configured.
- Dedicated memorial banner plus editable announcements.
- Phone-friendly administration page.
- Firebase Realtime Database live updates with local fallback.
- Updated service-worker cache so GitHub Pages receives new files instead of showing an old version.

## Publish on GitHub Pages
1. Upload every file in this folder to the root of the GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**, branch **main**, folder **/(root)**.
4. Save and open the GitHub Pages address.

Display: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

Admin: `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html`

## Firebase setup
Paste the complete Firebase Web App configuration into `config.js`. Realtime Database must be enabled.

Recommended database structure:

```text
boards/main
```

Temporary test rules only:

```json
{
  "rules": {
    "boards": {
      "$boardId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

These public write rules are suitable only for testing. For permanent use, protect the admin page and Firebase writes with Authentication.

## Music
- Leave the music URL blank to use the built-in melody.
- Or upload an MP3 named `music.mp3` and enter `music.mp3` in the admin page.
- Browsers require the user to press Play once before sound may begin.
