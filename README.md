# Häckl Architekten — Website-Entwurf fürs Erstgespräch

Nachbau der Referenzseite **bloom3d.studio** mit den Inhalten und Bildern von
**haeckl-architekten.de** und dem Instagram-Account **@haeckl_architekten**.

## Starten

```
cd site
npx http-server -p 8899 -c-1
```
→ http://localhost:8899

Noch einfacher: `START.cmd` im Projektordner doppelklicken — startet den Server und
öffnet den Browser.

Die Seite ist rein statisch (HTML/CSS/JS), alle Bibliotheken, Schriften und Medien
liegen lokal. Sie läuft auch per Doppelklick auf `site/index.html` ohne Server
(getestet, keine Konsolenfehler) — der Server ist trotzdem die sichere Variante für
die Präsentation, weil manche Browser Videos über `file://` zurückhaltender laden.

## Aufbau

```
site/
  index.html
  assets/
    css/style.css        Design-System + alle Sektionen
    js/main.js           Animationen (GSAP + ScrollTrigger + Lenis)
    js/vendor/           gsap, ScrollTrigger, ScrollToPlugin, lenis (lokal)
    fonts/               Inter, selbst gehostet (kein Google-Fonts-Aufruf)
    img/                 45 kuratierte Bilder
    video/               hero.mp4, cta.mp4, service.mp4
_research/               Referenzanalyse, Screenshots, Rohdaten (nicht ausliefern)
_tools/                  Playwright-Skripte für Screenshots und Messungen
```

## Sektionen (Reihenfolge wie Referenz)

| # | Sektion | Referenz-Pendant | Animation |
|---|---------|------------------|-----------|
| 1 | Preloader | identisch | Zähler 0→100, Clip-Path-Maske öffnet sich, Hero-Video skaliert 0.8→0.9→1 |
| 2 | Navbar | identisch | Logo-Buchstaben fahren beim Scrollen weg, heller Zustand über Hero + CTA |
| 3 | Hero | identisch | Fixiert; Projektsektion schiebt sich darüber. Überschrift zeilenweise maskiert |
| 4 | Ausgewählte Projekte | Featured Projects | 12-Spalten-Raster, Titel erscheinen beim Hover |
| 5 | Leistungen | Services | 3D-Karussell, 14 Karten auf einem Zylinder, rotiert −102°→−25° beim Scrollen |
| 6 | Büro + Zahlen | About | Zahlen zählen hoch |
| 7 | Warum Häckl Architekten | Why work with us | Gepinntes Akkordeon mit Bildwechsel und Snap |
| 8 | CTA | identisch | Parallax-Bild über 150 vh |
| 9 | FAQ | You asked, we answered | Akkordeon |
| 10 | Footer | identisch | — |

## Inhaltsquellen

* **Texte**: Büro-Seite (Architektur als interdisziplinärer Dialog, Methodik,
  Anspruch), Leistungsliste (Architektur / Innenarchitektur / Stadtplanung),
  Lebenslauf Martin Häckl, Jobs-Seite, Kontaktseite — alles von haeckl-architekten.de
* **Projektnamen und Orte**: aus den Unterseiten Privat / Konzept / Gewerbe /
  Wohnungsbau
* **Bilder**: 106 Bilder von der alten Seite heruntergeladen (Originalauflösung
  2048 px), davon 41 verwendet; dazu 14 Bilder von Instagram
* **Videos**: Pexels (Pexels License — kommerziell frei, keine Namensnennung nötig)

## Responsive

| Breite | Verhalten |
|--------|-----------|
| ≥ 992 px | Volle Choreografie: Hero-Pin, 3D-Karussell, gepinntes Akkordeon |
| 768–991 px | Karussell 3D bleibt, Akkordeon läuft ungepinnt als Liste |
| < 768 px | Karussell wird zur Vierer-Liste (die 10 leeren Ringplätze entfallen), Projektraster einspaltig, Projekttitel dauerhaft sichtbar (kein Hover auf Touch) |

## Offene Punkte / Annahmen

1. **Kennzahlen** in der Büro-Sektion (30+ Projekte, 25 Jahre, 3 Leistungsbereiche,
   2 Standorte) sind aus der alten Seite hergeleitet, aber **nicht offiziell bestätigt** —
   vor der Veröffentlichung mit Herrn Häckl abgleichen. Zu ändern in `index.html`,
   Block `about_nums`.
2. **Kontaktdaten** — drei Stellen bitte gegenprüfen:
   * E-Mail: auf der alten Seite durch Spamschutz verdeckt, hier steht
     `info@haeckl-architekten.de` als Platzhalter.
   * `F +49 172 8667661` ist so von der alten Seite übernommen. 0172 ist eine
     Mobilfunkvorwahl — vermutlich ist „M" statt „F" gemeint.
   * Die alte Seite schreibt „Ringstrassen 1"; hier steht „Ringstraße 1".
3. **Hero-Showreel** — wie auf der Referenzseite ein durchlaufendes Video mit harten
   Schnitten zwischen mehreren Motiven. 31,7 s, 1920 × 1080, 15 MB, sieben Einstellungen
   à 4–5,5 s:

   | # | Motiv | Quelle |
   |---|-------|--------|
   | 1 | Dunkle Holzfassade in der Nebelwiese, Morgen | Veo 3.1 |
   | 2 | Baukörper in der Dämmerung | Pexels |
   | 3 | Innenraum Tag: Sichtbeton + Eiche, Lichtband | Veo 3.1 |
   | 4 | Verwitterte Lärche mit Blattschatten | Veo 3.1 |
   | 5 | Innenraum Abend: Holz + Beton, warmes Licht | Veo 3.1 |
   | 6 | Holzfassade im Nebel, nah | Pexels |
   | 7 | Blaue Stunde, warm erleuchtete Fenster | Veo 3.1 |

   **Wichtig fürs Gespräch:** Keine dieser Einstellungen zeigt ein Häckl-Projekt. Es ist
   bewusst ein Stimmungsfilm — die Motive sind aber eng auf die Handschrift des Büros
   abgestimmt (dunkle Vertikalschalung, Stehfalzdach, Sichtbeton, bayerische Wiese).
   Sobald eigenes Filmmaterial existiert, gehört es hier hinein.

   **Neu bauen / austauschen:** Schnittliste steht in `_tools/showreel.json`
   (Datei, Startzeit, Dauer, Farbanpassung je Einstellung).
   Danach `cd _tools && node build-showreel.mjs` — schreibt direkt nach
   `site/assets/video/hero.mp4`. Einzelne Clips liegen in `_research/veo/` und
   `_research/showreel_src/`. Das Poster-Bild (`assets/img/hero-poster.jpg`) ist das
   erste Bild des Showreels und wird bei Änderungen mit
   `ffmpeg -ss 0.3 -i hero.mp4 -frames:v 1 hero-poster.jpg` neu erzeugt.
4. **Schrift**: Die Referenz nutzt „Helvetica Now" (lizenzpflichtig). Hier steht
   Inter — sehr nah in Form und Metrik, frei nutzbar. Bei Bedarf lizenzieren und in
   `style.css` in der `--font`-Kette vorne eintragen.
5. **Impressum / Datenschutz** verlinken derzeit auf `#`.
6. Unterseiten (Projektdetails, Leistungen, Kontaktformular) sind noch nicht angelegt —
   die Startseite ist bewusst als Gesprächsgrundlage gebaut.
7. **Bildbestand:** Von der alten Seite gibt es nur zwei hochauflösende Außenaufnahmen
   (MFH HVK und Haus Burg). Beide erscheinen deshalb an mehreren Stellen — Haus Burg
   im Projektraster und als CTA-Hintergrund, MFH HVK im Raster und auf der
   Leistungskarte „Stadtplanung". Die Referenzseite handhabt das genauso, trotzdem
   wären zusätzliche Außen- und Detailaufnahmen der stärkste Hebel für die Seite.
8. Das Porträt von Martin Häckl liegt nur in 439 × 537 px vor und wurde für die
   Vollflächen-Darstellung hochgerechnet. Ein Original in höherer Auflösung wäre besser.
