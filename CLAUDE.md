# CLAUDE.md — SCHLÜND Website

One-Page-Website der Erfurter Band SCHLÜND: https://schluend.fun

## Was das ist

Express-Server (ESM, Node 20) mit **einem** EJS-Template. Inhalte kommen aus
JSON-Dateien, gepflegt über das CMS-Admin-UI von `@dobschal/express-cms`
(eigenes NPM-Paket, Autor = Repo-Owner → Änderungen dort sind möglich, siehe unten).

Es gibt **kein** Build-System außer SASS, keine Tests, kein Framework im Frontend
(Vanilla JS inline im Template).

## Struktur

```
server.js                  Express-Setup, CMS-Modelldefinitionen, einzige Route "/{*splat}"
lib/format.js              Template-Helper: formatDate, renderRichText, collectImages
views/index.ejs            Die komplette Seite (HTML + inline <script> pro Sektion)
styles/style.scss          Alle Styles, in // region <sektion> Blöcken
public/                    Statische Assets (Bilder, Fonts, Icons, robots.txt, favicons)
public/build/style.css     SASS-Output (committed!, wird vom Template geladen)
.express_cms/              CMS-Datenverzeichnis — GITIGNORED, lebt nur auf dem Server
  data/*.json              Inhalte (concerts, music, photos, recommendations, blog)
  data/password.json       Admin-Passwort (salt + pbkdf2-hash)
  public/uploads/          Vom Kunden hochgeladene Bilder
  public/index.html        Admin-UI — wird bei JEDEM Serverstart aus node_modules überschrieben
.github/workflows/main.yml CI/CD → Hetzner
```

## Entwicklung

```bash
npm start     # nodemon server.js  +  sass --watch  (parallel)
              # → http://localhost:3004,  Admin: http://localhost:3004/express-cms
npm run scss  # nur SASS-Watcher
```

Wichtig: `public/build/style.css` ist **committed**. Nach SCSS-Änderungen muss die
kompilierte CSS mit ins Commit, sonst deployed man alte Styles
(im Docker-Image läuft `npm start`, das den SASS-Watcher mitstartet — aber nicht darauf verlassen).

Lokal existiert `.express_cms/` mit echten Kundendaten-Kopien, ist aber gitignored.
Ohne dieses Verzeichnis legt das CMS es beim ersten Start leer neu an; dann muss
im Admin-UI ein neues Passwort gesetzt werden.

## Deployment

Push auf `main` → GitHub Action → SSH auf Hetzner-Server:
`git reset --hard origin/main` in `/root/deployments/schluend-website`,
dann `docker compose down/build --no-cache/up -d`.

`.express_cms` ist im `docker-compose.yml` als Bind-Volume gemountet →
**Kundendaten und Uploads überleben Deployments**. Niemals per Deployment
überschreiben. Secrets: `SSH_KEY`, `HOST` in den GitHub-Repo-Secrets.

## Datenmodell (server.js)

Modelle werden in `expressCms(app, {models: {...}})` deklariert; jedes Modell wird zu
`.express_cms/data/<name>.json` (Array von Objekten mit generierter `id`).

| Modell | Felder |
|---|---|
| `concerts` | title, date (text, dt. Format), link |
| `music` | title, releaseDate, spotify, bandcamp, image (URL-text, extern gehostet) |
| `photos` | author, file |
| `recommendations` | author, text (longtext) |
| `blog` | title, date, content (longtext), image, image2, image3, image4 |

Verfügbare Feldtypen des CMS: `text`, `number`, `email`, `date`, `boolean`,
`longtext` (textarea), `file` (Upload, URL im Feld), `image` (Upload + erzeugt
zusätzlich `<feld>_thumbnail`, 300×300 client-seitig gecroppt).
Sonderkey `__public: true` legt die JSON unter `public/data/` statt `data/` ab.

Ein `image`/`file`-Feld = **genau eine** Datei (multer `.single`). Mehrere Bilder
brauchen entweder mehrere Felder (`image`, `image2`, …) oder eine Paketerweiterung.

Ein neues Feld an einem bestehenden Modell ist unkritisch: alte Einträge haben es
einfach nicht (`undefined`) → im Template immer auf Existenz prüfen.

Beim Bearbeiten sendet das Admin-UI nur Felder mit *neu gewählter* Datei; leere
File-Inputs werden weggelassen und der Server macht `Object.assign` → vorhandene
Bild-URLs bleiben erhalten.

## Rendering-Konventionen

- Alles läuft über `views/index.ejs`, gerendert in einer Catch-all-GET-Route.
  `readData("<modell>")` liefert das Array; Blog wird nach `date` absteigend sortiert.
- `<%= %>` escaped (Standard!). Einzige Ausnahme ist `renderRichText()` aus
  `lib/format.js`, das mit `<%- %>` ausgegeben wird: es escaped selbst zuerst
  und erlaubt danach nur ein enges Subset (`[Text](url)`, nackte URLs, `**fett**`,
  Absätze/Umbrüche). Neues rohes HTML aus dem CMS niemals ohne diesen Weg ausgeben.
- Blogbilder immer über `collectImages(entry)` sammeln (liefert `{full, thumbnail}`
  pro gefülltem Slot) statt die `image*`-Felder einzeln abzufragen.
- Die Lightbox am Ende von `views/index.ejs` ist generisch: ein klickbares Element
  braucht nur `data-lightbox="<galerie>"`, `data-lightbox-src="<volles Bild>"` und
  optional `data-lightbox-caption`. Gleicher Galerie-Name = gemeinsame Galerie,
  Reihenfolge = DOM-Reihenfolge. Kein JS-Anfassen nötig, um weitere Bilder anzubinden.
- Sektionen sind `<section id="...">` mit passendem `// region`-Block in `style.scss`
  und ggf. einem inline `<script>` direkt darunter. Neue Features in diesem Muster halten.
- Kein Bundler → keine imports im Frontend, nur globale Funktionen im Template.

## Design

Dark, brutalistisch: Hintergrund `#0A0A0A`, weiß, durchgehend `text-transform: uppercase`
(Ausnahme: Fließtexte setzen `text-transform: none`), Font "Josefin Sans" (lokal, woff2),
2px weiße Rahmen, `--container-width: 720px`, Mobile-First mit Breakpoint 768px.
Vorhandene Keyframes (`fade-in`, `animate-borders`, …) wiederverwenden statt neue erfinden.

## Das Admin-UI anpassen

`.express_cms/public/index.html` wird bei jedem Serverstart von
`node_modules/@dobschal/express-cms/index.html` überschrieben — dort editieren ist zwecklos.
Zwei valide Wege:

1. **Paket anpassen und neu veröffentlichen** (`github.com/dobschal/express-cms`),
   danach Version in `package.json` hochziehen. Richtig für Features, die alle
   Nutzer des Pakets brauchen (z. B. ein `images`-Multi-Upload-Typ).
2. **Lokal überschreiben**: eigene Route/Static *vor* `expressCms(app, ...)` in
   `server.js` registrieren — die erste passende Route in Express 5 gewinnt.
   Richtig für projektspezifische Sonderwünsche.

## Kunde

Die Band pflegt Inhalte selbst über `/express-cms`. Änderungen müssen ohne
Erklärung bedienbar sein; Syntax, die man lernen muss (z. B. Markdown im Text),
gehört dokumentiert bzw. als Hinweis ins Formular.
