# Design

## Context

Siehe proposal.md. Custom Folders speichert `folders.meta.icon` nur, wenn der Name in `config('customfolders.icons')` steht oder leer ist. Die Seitenleiste rendert fest `<i class="glyphicon glyphicon-{{ getTypeIcon() }}">` in `li[data-folder_id]`. `getTypeIcon()` ist der Filter `folder.type_icon` und liefert für einen Custom Folder genau diesen Namen. Anlegen liefert `id` und lädt die Seite neu. Ändern bleibt auf der Seite. Ein Realtime-Ereignis ersetzt `#folders` per `el_folders.html(data.folders_html)`. Der Dialog „Neuer Ordner“ ruft `initNewFolder` auf.

## Goals / Non-Goals

**Goals:**

- Die Spec `folder-icons` erfüllen, ohne Custom Folders, Tags, NestedTags, FolderDrop oder den Core zu patchen.

**Non-Goals:**

- Glyphicons an anderen Stellen von FreeScout ersetzen.
- Systemordner umhängen.
- Eigene Icon-Dateien hochladen.
- Twemoji oder eine Emoji-Schrift.
- Lucide oder Emoji zur Laufzeit aus dem Netz laden.
- Die Whitelist von Custom Folders erweitern.

## Decisions

0. **Browser-Code in TypeScript, Server in PHP.** FreeScout lädt Module als PHP und das Browser-Skript als Datei. Die Oberfläche liegt in TypeScript und wird vor dem Ausliefern nach `Public/js/module.js` übersetzt. Im Container gibt es kein Node. Der übersetzte Stand wird mit ausgeliefert. Die Typen enden an den globalen FreeScout-Funktionen (`$`, `fsAjax`, `laroute`). Dafür reicht eine kleine Deklaration.

1. **Eigenes Modul `IconPicker`, Alias `iconpicker`.** Es verlangt NestedTags und FolderDrop nicht. Custom Folders muss aktiv sein, weil dort das Feld und die Whitelist liegen. Alternative: das Select in Custom Folders patchen. Verworfen, weil ein Update von Custom Folders den Patch überschreibt.

2. **Glyphicon bleibt das versteckte `select[name=icon]`.** Die Auswahl schreibt den Namen dort hinein. Absenden und Prüfen macht Custom Folders. Das Modul schreibt `folders.meta` nicht. Alternative: den Namen selbst in `meta` legen. Verworfen, weil die Prüfung und der übrige Ordner-Schreibweg dann doppelt wären.

3. **Lucide und Emoji in der Tabelle `folder_icon`.** Primärschlüssel `folder_id`. Spalten `kind` (`lucide` oder `emoji`) und `value`. Ein Glyphicon löscht die Zeile. Lucide oder Emoji leeren das Select, damit `meta.icon` leer wird und kein altes Glyphicon unter dem neuen Icon liegen bleibt. Alternative: Lucide-Namen in `meta.icon`. Verworfen, weil Custom Folders sie ablehnt und die Seitenleiste sie als Glyphicon-Klasse rendert.

4. **Anzeige: Glyphicon gewinnt.** Die Seitenleiste tauscht das `<i>` nur, wenn die Klasse kein echtes Glyphicon ist (`glyphicon-` ohne Namen) und eine Zeile existiert. Ist ein Name gesetzt, bleibt das Glyphicon, auch wenn eine Zeile noch da ist. Systemordner haben einen Namen und keine Zeile.

5. **Speichern hängt am Ajax von Custom Folders.** Ein `$.ajaxPrefilter` auf `mailboxes.custom_folders.ajax` speichert oder löscht die Zeile nach erfolgreichem Anlegen, Ändern oder Löschen, bevor der bisherige success-Callback läuft. Anlegen nutzt `response.id`, damit die Zeile steht, bevor die Seite neu lädt. Schlägt die Extra-Wahl fehl, wird der bisherige Callback nicht aufgerufen und der Fehlschlag gezeigt. Andere Prefilter rufen ihren Vorgänger auf. Dieses Modul tut dasselbe.

6. **Der Server prüft Katalog und Recht.** Er nimmt nur eine `value`, die exakt im mitgelieferten Lucide- oder Emoji-Katalog steht. Markup fällt damit weg. Lucide wird aus den eigenen Pfad-Daten als SVG gesetzt, das Emoji als Textknoten. Der Ordner muss ein Custom Folder derselben Mailbox sein, und `CustomFolder::canUserUpdateMailboxCustomFolders` muss gelten. Eine Zeile ohne Ordner wird beim Lesen der Mailbox ignoriert und gelöscht. Das fängt Löschungen ab, die nicht über das Formular laufen.

7. **Die Auswahl klappt in der Formularzeile auf.** Kein Popover am `body`, weil der Dialog sonst abschneidet. Das Select bleibt im Formular, nur versteckt. Suche filtert die Kataloge im Speicher. Sichtbar ist ein Fenster, Weiterrollen hängt den nächsten Ausschnitt an. Deutsche Aliasse liegen in einer kleinen Datei. `schloss` zeigt auf `lock`. Zuletzt gewählte Icons liegen unter `iconpicker.recent` im `localStorage`. Pfeile, Enter und Escape hängen am offenen Feld. `body.dm` färbt die Fläche und die Lucide-SVGs über `currentColor`. Emoji bleiben Zeichen.

8. **Kataloge sind Dateien im Modul.** Lucide ist ein festgehaltenes Snapshot der Icon-Pfade, Lizenz ISC, ohne Abruf zur Laufzeit. Die Emoji-Liste ist eine feste Auswahl mit deutschen und englischen Namen, nicht der ganze Unicode und keine Bildschrift. Die Glyphicon-Namen sind eine Kopie von `config('customfolders.icons')`. Der Picker lädt diese Dateien einmal.

9. **Nachladen der Seitenleiste.** Ein `MutationObserver` auf `#folders` setzt Lucide und Emoji neu, nachdem `folders_html` die Liste ersetzt hat. Dieselbe Funktion setzt das Icon in der Verwaltung neben den Ordnernamen. Der Boot liefert nur die Zeilen der aktuellen Mailbox, analog zu `nestedtagsStart`, für eine angemeldete Person, die diese Mailbox sehen darf.

10. **UpdateGuard vollständig.** `module.json` nennt `latestVersionUrl` (Inhalt von `version.txt`, eine Versionszeile), `latestVersionZipUrl` (`IconPicker.zip`), `sha256sumsUrl` und `healthCommand` `iconpicker:health`. Der Befehl ist nur lesend, hat `--json` und endet mit 0 oder 1. Er vergleicht die Glyphicon-Kopie mit `config('customfolders.icons')` und meldet `fail`, wenn sie auseinanderlaufen. `interop.json` nennt FreeScout, PHP und Custom Folders als `required_dependency`. Es gibt eine Migration, deshalb `updateGuard.migrations` = `backward-compatible`. `scripts/sha256sums.sh` und der GitHub-Workflow schreiben `SHA256SUMS` im Format `<64 hex>  IconPicker.zip`. Der Health-Check läuft ohne veröffentlichtes Release.

## Risks / Trade-offs

- [Die Seitenleiste ändert das `<i>`] → ohne erkennbare leere Glyphicon-Klasse bleibt das Core-Icon stehen. Eine Extra-Zeile geht dabei nicht verloren.
- [Anlegen speichert den Ordner, die Extra-Wahl scheitert] → die Spec lässt das Formular stehen. Der Ordner existiert, die Wahl kann erneut gespeichert werden.
- [Modul aus] → Glyphicons bleiben. Lucide und Emoji verschwinden, weil `meta.icon` leer ist. Die Tabelle darf bleiben.
- [Emoji sehen je nach System anders aus] → keine eigene Schrift, dafür kein Netz und keine zweite Icon-Datei.
- [Lucide-Snapshot ist groß] → die Datei liegt statisch im Modul, das Feld hängt nur ein Fenster an.
- [Custom Folders ändert die Whitelist] → `iconpicker:health` wird `fail`, bis die Kopie nachgezogen ist. Der Picker bietet bis dahin keinen Namen an, den der Server ablehnt, sofern die Kopie die Quelle der angebotenen Namen bleibt.
- [NestedTags rückt die `<li>` nur ein] → `data-folder_id` und das `<i>` bleiben, der Tausch braucht kein Wissen über den Baum.

## Migration Plan

Modul nach `/data/Modules/IconPicker` legen, öffentlich verknüpfen, aktivieren. `freescout:module-install` führt die Migration aus. Rollback: Modul aus. Die Tabelle `folder_icon` darf bleiben. Gesetzte Glyphicons bleiben. Lucide und Emoji werden nicht mehr gezeichnet.
