# Tasks

## 1. Modulgerüst

- [x] 1.1 Modul `IconPicker` (Alias `iconpicker`) mit `module.json`, Provider, Route und Migration `folder_icon` (`folder_id` Primärschlüssel, `kind`, `value`) anlegen. Verify: `php -l` auf den neuen PHP-Dateien ist ohne Fehler, die Migration nennt die drei Spalten.
- [x] 1.2 README beschreibt Installation nach `/data/Modules/IconPicker`, Aktivieren und den Rollback (Modul aus, Glyphicons bleiben, Lucide und Emoji verschwinden). Verify: die drei Punkte stehen im README.

## 2. Kataloge und Prüfung

- [x] 2.1 Glyphicon-Namen als Kopie der Whitelist, Lucide als festgehaltenes Pfad-Snapshot mit ISC-Lizenz und eine Emoji-Liste mit deutschen und englischen Namen ins Modul legen. Keine Schrift, keine Adresse nach außen. Der Alias `schloss` zeigt auf `lock`. Verify: ein PHP-Test ohne Datenbank lässt `lock` und `schloss` zu, lehnt einen fremden Lucide-Namen, ein fremdes Emoji und Markup ab, und die Katalogdateien enthalten keine `http`-Adresse.

## 3. Speichern

- [x] 3.1 Endpoint nimmt die Ordner-Id und die Wahl. Ein Glyphicon-Name löscht die Zeile und lässt das Select stehen. Lucide oder Emoji schreibt die Zeile nur nach bestandener Katalogprüfung, nur für einen Custom Folder derselben Mailbox und nur mit `CustomFolder::canUserUpdateMailboxCustomFolders`. Eine Zeile ohne Ordner wird beim Lesen entfernt. Verify: der PHP-Test deckt Glyphicon löscht die Zeile, Lucide und Emoji schreiben sie, Ablehnung ohne Recht, Systemordner, fremde Mailbox und die fehlende Ordnerzeile ab.
- [x] 3.2 Ein `$.ajaxPrefilter` auf dem Custom-Folders-Ajax speichert oder löscht die Zeile nach erfolgreichem Anlegen, Ändern oder Löschen, bevor der bisherige success-Callback läuft. Anlegen nutzt `response.id`. Schlägt die Extra-Wahl fehl, läuft der bisherige Callback nicht. Verify: im Script steht der Prefilter auf diesem Ajax, das Anlegen liest `id`, und der ursprüngliche Callback läuft erst nach der eigenen Antwort.

## 4. Auswahl

- [x] 4.1 Das `select[name=icon]` bleibt im Formular und wird versteckt. Die Auswahl klappt in der Formularzeile auf, auch in `initNewFolder`, und öffnet keinen zweiten Dialog. Suche filtert Glyphicon-Namen, `schloss`, Lucide-Namen und Emoji-Namen. Bei leerer Suche kommt zuerst ein Ausschnitt, Weiterrollen hängt den nächsten an. Zuletzt gewählte Icons liegen unter `iconpicker.recent`. Pfeile, Enter und Escape gelten nur bei offenem Feld. `body.dm` färbt die Fläche und Lucide über `currentColor`. Verify: das Script schreibt den Glyphicon-Namen in das Select, leert es bei Lucide oder Emoji, und die CSS-Datei enthält eine `body.dm`-Regel.

## 5. Seitenleiste und Verwaltung

- [x] 5.1 Die Seitenleiste tauscht das `<i>` nur, wenn kein Glyphicon-Name in der Klasse steht und eine Zeile existiert. Ein `MutationObserver` auf `#folders` setzt das nach `folders_html` neu. Systemordner bleiben. Die Verwaltung zeigt das Icon neben dem Namen. Der Boot liefert nur Zeilen der aktuellen Mailbox. Verify: das Script liest `data-folder_id`, ersetzt ein `<i class="glyphicon glyphicon-star">` nicht, und setzt den Beobachter auf `#folders`.

## 6. UpdateGuard

- [x] 6.1 `iconpicker:health` mit `--json`, `version.txt`, `interop.json`, `latestVersionUrl`, `latestVersionZipUrl`, `sha256sumsUrl` und `updateGuard.migrations` = `backward-compatible`. Die Prüfung vergleicht die Glyphicon-Kopie mit `config('customfolders.icons')`. Verify: `php artisan iconpicker:health --json` endet mit 0 und `"status":"ok"`, eine abweichende Kopie ergibt Exit-Code 1, und der Befehl schreibt nichts.

## 7. Laufende Instanz

- [x] 7.1 Modul in den Container `freescout-app` legen, öffentlich verknüpfen, aktivieren und die Migration ausführen. Verify: die Tabelle `folder_icon` existiert und das Modul ist aktiv. Custom Folders ist unverändert.

## Workflow follow-up

- Den Change nach dem Review mit `openspec archive` archivieren.
