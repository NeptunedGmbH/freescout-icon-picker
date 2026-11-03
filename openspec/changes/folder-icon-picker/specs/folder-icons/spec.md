# Spec Delta

## Purpose

Ein Custom Folder bekommt ein sichtbares Icon. Glyphicons bleiben im bestehenden Feld. Lucide und Emoji liegen daneben und erscheinen in der Seitenleiste.

## ADDED Requirements

### Requirement: Das Feld zeigt die Icons
Das Formular eines Custom Folders MUST das Icon als Bild zeigen, nicht nur als englischen Namen. Das Feld MUST die Glyphicons anbieten, die Custom Folders akzeptiert, und daneben die mitgelieferten Lucide-Icons und Emojis. Es MUST im Dialog „Neuer Ordner“ in diesem Dialog bleiben und MUST NOT einen zweiten Dialog öffnen. Das bisherige Feld MUST einen Glyphicon-Namen oder leer absenden.

#### Scenario: Icon sehen
- **WHEN** jemand das Icon-Feld öffnet
- **THEN** sind die Glyphicons als Zeichen sichtbar

#### Scenario: Neuer Ordner
- **WHEN** das Formular für einen neuen Ordner in seinem Dialog offen ist
- **THEN** öffnet sich die Auswahl in diesem Dialog

#### Scenario: Gesetztes Glyphicon
- **WHEN** ein Custom Folder schon einen Glyphicon-Namen hat
- **THEN** zeigt das Feld dieses Glyphicon

#### Scenario: Nur die erlaubte Glyphicon-Liste
- **WHEN** das Feld Glyphicons zeigt
- **THEN** ist jeder Name einer, den Custom Folders akzeptiert, und kein anderer Glyphicon-Name wird angeboten

### Requirement: Suche grenzt die Liste ein
Die Auswahl MUST die sichtbare Liste auf den eingegebenen Text beschränken. Der Text MUST Glyphicon-Namen, mitgelieferte deutsche Aliasse, Lucide-Namen und Emoji-Namen treffen. Bei leerer Suche MUST zuerst ein Ausschnitt sichtbar sein. Der Rest MUST durch Weitersuchen oder Weiterscrollen erreichbar sein.

#### Scenario: Englischer Name
- **WHEN** jemand `lock` eingibt
- **THEN** ist das Glyphicon lock unter den Treffern

#### Scenario: Deutsches Wort
- **WHEN** jemand `schloss` eingibt
- **THEN** ist das Glyphicon lock unter den Treffern

#### Scenario: Lucide-Name
- **WHEN** jemand den Namen eines mitgelieferten Lucide-Icons eingibt
- **THEN** ist dieses Icon unter den Treffern

#### Scenario: Emoji-Name
- **WHEN** jemand den Namen eines mitgelieferten Emojis eingibt
- **THEN** ist dieses Emoji unter den Treffern

### Requirement: Tastatur wählt
Pfeiltasten MUST die Markierung verschieben. Enter MUST das markierte Icon übernehmen. Escape MUST die Auswahl schließen, ohne das gespeicherte Icon zu ändern.

#### Scenario: Enter übernimmt
- **WHEN** ein Icon markiert ist und Enter gedrückt wird
- **THEN** gilt dieses Icon als gewählt

#### Scenario: Escape verwirft nichts
- **WHEN** die Auswahl offen ist und Escape gedrückt wird
- **THEN** schließt sie sich und das bisher gespeicherte Icon bleibt

### Requirement: Zuletzt gewählt
Bei leerer Suche MUST die Auswahl Icons zeigen, die dieser Browser zuletzt gewählt hat, vor dem übrigen Ausschnitt. Diese Liste MUST im Browser bleiben.

#### Scenario: Leere Suche
- **WHEN** die Suche leer ist und dieser Browser schon ein Icon gewählt hat
- **THEN** steht dieses Icon vor dem übrigen Ausschnitt

### Requirement: Glyphicon bleibt im bestehenden Speicher
Die Wahl eines Glyphicons MUST diesen Namen über das Speichern von Custom Folders ablegen und MUST eine Lucide- oder Emoji-Zeile dieses Ordners entfernen. Die Seitenleiste MUST dieses Glyphicon zeigen.

#### Scenario: Stern
- **WHEN** jemand das Glyphicon star wählt und speichert
- **THEN** trägt der Ordner den Namen star und keine Lucide- oder Emoji-Zeile

#### Scenario: Seitenleiste
- **WHEN** der Ordner den Glyphicon-Namen star trägt und keine Extra-Zeile hat
- **THEN** zeigt die Seitenleiste das Glyphicon star

### Requirement: Lucide und Emoji liegen daneben
Die Wahl eines Lucide-Icons oder Emojis aus der mitgelieferten Liste MUST diese Wahl am Ordner speichern und MUST den Glyphicon-Namen leeren. Ein Wert außerhalb der Liste oder mit Markup MUST abgelehnt werden und MUST NOT erscheinen. Die Seitenleiste MUST das gewählte Lucide-Icon oder Emoji zeigen, solange der Glyphicon-Name leer ist.

#### Scenario: Lucide
- **WHEN** jemand ein Lucide-Icon aus der Liste wählt und speichert
- **THEN** ist der Glyphicon-Name leer und die Seitenleiste zeigt dieses Lucide-Icon

#### Scenario: Emoji
- **WHEN** jemand ein Emoji aus der Liste wählt und speichert
- **THEN** ist der Glyphicon-Name leer und die Seitenleiste zeigt dieses Emoji

#### Scenario: Fremder Wert
- **WHEN** ein Lucide-Name oder ein Emoji gesendet wird, das nicht in der Liste steht
- **THEN** wird nichts dazu gespeichert

#### Scenario: Markup
- **WHEN** der Wert Markup enthält
- **THEN** wird er abgelehnt und nicht angezeigt

### Requirement: Leere Auswahl
Eine leere Icon-Wahl MUST den Glyphicon-Namen leeren und MUST die Lucide- oder Emoji-Zeile des Ordners entfernen. Die Seitenleiste MUST für diesen Ordner kein Icon zeigen.

#### Scenario: Auswahl geleert
- **WHEN** jemand das Icon leert und speichert
- **THEN** hat der Ordner keinen Glyphicon-Namen, keine Extra-Zeile, und die Seitenleiste zeigt kein Icon

### Requirement: Glyphicon gewinnt, wenn beide gesetzt sind
Hat ein Ordner einen Glyphicon-Namen und zusätzlich eine Lucide- oder Emoji-Zeile, MUST die Seitenleiste das Glyphicon zeigen.

#### Scenario: Beides vorhanden
- **WHEN** ein Ordner den Glyphicon-Namen star und eine Lucide-Zeile hat
- **THEN** zeigt die Seitenleiste das Glyphicon star

### Requirement: Seitenleiste nach dem Ersetzen der Liste
Wird die Ordnerliste der Seitenleiste ersetzt, MUST ein Lucide-Icon oder Emoji wieder erscheinen. Ein Systemordner MUST sein bisheriges Icon behalten. Ein eingerückter Custom Folder MUST sein gewähltes Icon behalten.

#### Scenario: Liste ersetzt
- **WHEN** die Ordnerliste der Seitenleiste durch eine neue Liste ersetzt wird
- **THEN** zeigt ein Ordner mit Lucide-Icon oder Emoji dieses Icon wieder

#### Scenario: Systemordner
- **WHEN** die Seitenleiste den Posteingang zeigt
- **THEN** bleibt dessen Icon unverändert

#### Scenario: Eingerückter Ordner
- **WHEN** ein Custom Folder unter einem anderen eingerückt ist
- **THEN** zeigt er sein gewähltes Icon

### Requirement: Vorschau in der Ordnerverwaltung
Die Liste der Custom Folders MUST das gewählte Icon neben dem Ordnernamen zeigen.

#### Scenario: Geschlossene Zeile
- **WHEN** die Verwaltung einen Custom Folder mit gewähltem Icon zeigt
- **THEN** steht dieses Icon neben dem Namen, ohne den Ordner zu öffnen

### Requirement: Nur berechtigte Custom Folders
Lucide oder Emoji MUST nur gespeichert werden, wenn die Person Custom Folders dieser Mailbox ändern darf und der Ordner ein Custom Folder dieser Mailbox ist.

#### Scenario: Ohne Recht
- **WHEN** die Person Custom Folders dieser Mailbox nicht ändern darf
- **THEN** wird kein Lucide-Icon und kein Emoji gespeichert

#### Scenario: Kein Custom Folder
- **WHEN** das Ziel kein Custom Folder ist
- **THEN** wird kein Lucide-Icon und kein Emoji gespeichert

#### Scenario: Fremde Mailbox
- **WHEN** der Ordner zu einer anderen Mailbox gehört
- **THEN** wird kein Lucide-Icon und kein Emoji gespeichert

### Requirement: Anlegen speichert vor dem Verlassen
Beim Anlegen MUST ein Lucide-Icon oder Emoji an der neuen Ordner-Id gespeichert sein, bevor das Formular die Seite verlässt. Schlägt dieses Speichern fehl, MUST der Fehlschlag sichtbar sein und die Seite MUST NOT neu geladen werden.

#### Scenario: Neuer Ordner mit Emoji
- **WHEN** jemand einen Ordner anlegt und ein Emoji wählt
- **THEN** zeigt der neue Ordner dieses Emoji

#### Scenario: Extra-Wahl scheitert
- **WHEN** der Ordner angelegt wurde, das Emoji aber nicht gespeichert werden kann
- **THEN** ist der Fehlschlag sichtbar und das Formular bleibt

### Requirement: Löschen räumt die Extra-Wahl auf
Das Löschen eines Custom Folders MUST seine Lucide- oder Emoji-Zeile entfernen. Eine Zeile, deren Ordner fehlt, MUST beim Lesen ignoriert und entfernt werden.

#### Scenario: Ordner gelöscht
- **WHEN** ein Custom Folder mit Emoji gelöscht wird
- **THEN** ist dieses Emoji nicht mehr gespeichert

#### Scenario: Ordner fehlt
- **WHEN** eine gespeicherte Wahl auf einen Ordner zeigt, den es nicht gibt
- **THEN** wird das Icon nicht gezeigt und die Zeile entfernt

### Requirement: Dunkle Oberfläche
Auf der dunklen Oberfläche MUST die Auswahl und ein Lucide-Icon die Textfarbe annehmen. Ein Emoji MUST das Emoji-Zeichen bleiben.

#### Scenario: Lucide im Dunkeln
- **WHEN** die Oberfläche dunkel ist und ein Ordner ein Lucide-Icon zeigt
- **THEN** hat das Icon die Textfarbe

#### Scenario: Emoji im Dunkeln
- **WHEN** die Oberfläche dunkel ist und ein Ordner ein Emoji zeigt
- **THEN** bleibt das Emoji-Zeichen stehen

### Requirement: Kataloge ohne Netz
Die Glyphicon-Liste, die Lucide-Icons und die Emoji-Liste MUST Dateien des Moduls sein. Das Wählen und das Anzeigen eines Icons MUST NOT eine Verbindung nach außen aufbauen.

#### Scenario: Auswahl ohne Netz
- **WHEN** jemand ein Icon wählt oder die Seitenleiste es zeigt
- **THEN** wird dafür keine Verbindung nach außen aufgebaut

### Requirement: UpdateGuard prüft das Modul
Das Modul MUST den Artisan-Befehl `iconpicker:health` registrieren. Mit `--json` MUST die Ausgabe ein JSON-Objekt mit `status` `ok` oder `fail` sein. Exit-Code 0 MUST genau den gesunden Zustand bedeuten. Der Befehl MUST NOT schreiben, migrieren oder das Netzwerk benutzen. Er MUST `fail` melden, wenn die Glyphicon-Liste des Moduls von der Liste abweicht, die Custom Folders akzeptiert.

#### Scenario: Gesundes Modul
- **WHEN** die Dateien, die Klassen und die Route lesbar sind, die Glyphicon-Listen übereinstimmen und `php artisan iconpicker:health --json` läuft
- **THEN** ist der Exit-Code 0 und `status` ist `ok`

#### Scenario: Liste driftet
- **WHEN** die Glyphicon-Liste des Moduls nicht die Liste ist, die Custom Folders akzeptiert
- **THEN** ist der Exit-Code 1 und `status` ist `fail`

#### Scenario: Prüfung ändert nichts
- **WHEN** der Befehl läuft
- **THEN** schreibt er keine Zeile, startet keine Migration und baut keine Verbindung nach außen auf
