# Proposal

## Why

Beim Custom Folder steht das Icon in einem Select aus etwa 250 englischen Glyphicon-Namen. Darunter ein Link auf eine Tabelle bei w3schools. Man wählt einen Namen und sieht das Icon erst in der Seitenleiste.

## What Changes

- Das Select bleibt im Formular und speichert weiter einen Glyphicon-Namen nach `folders.meta.icon`. Sichtbar wird ein durchsuchbares Feld mit den Icons, die Custom Folders zulässt.
- Dieselbe Auswahl zeigt zusätzlich Lucide-Icons und eine feste Emoji-Liste. Die kommen nicht in `meta.icon`. Custom Folders lehnt fremde Namen ab, und die Seitenleiste setzt fest `glyphicon glyphicon-…`.
- Lucide und Emoji liegen in einer eigenen Zeile pro Ordner. Die Seitenleiste zeigt sie anstelle des leeren Glyphicons. Ein Glyphicon löscht diese Zeile.
- Das Feld öffnet sich in der Zeile, auch im Modal „Neuer Ordner“. Kein zweites Modal.
- Modul aus: gesetzte Glyphicons bleiben. Lucide und Emoji verschwinden, der Ordner hat dann kein Icon.

## Capabilities

### New Capabilities

- `folder-icons`: Icon eines Custom Folders wählen und in der Seitenleiste zeigen. Glyphicons über den bestehenden Speicher, Lucide und Emoji daneben.

### Modified Capabilities

## Impact

- Neues Modul `IconPicker`, Alias `iconpicker`, Repo `freescout-icon-picker`.
- Eine Tabelle für Lucide und Emoji. `folders.meta` schreibt nur Custom Folders, und nur einen erlaubten Glyphicon-Namen oder leer.
- Lucide liegt als Datei im Modul. Kein Abruf nach außen. Emoji sind Zeichen aus einer festen Liste, ohne eigene Schrift.
- Custom Folders, Tags, NestedTags und FolderDrop bleiben unangetastet. NestedTags und FolderDrop sind nicht nötig.
