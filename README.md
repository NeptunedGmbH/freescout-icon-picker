# IconPicker

Add-on for the official [Custom Folders](https://freescout.net/module/custom-folders/) module. Version 0.1.

Searchable icon picker for Custom Folders. The select stays in the form. A Glyphicon name is still stored in `folders.meta.icon`. Lucide icons and emoji live in the `folder_icon` table and show in the sidebar while no Glyphicon name is set.

The module stays idle unless Custom Folders is active and FreeScout has marked its license as activated. The license key is never read.

License: [MIT](LICENSE). Lucide is under the ISC license in `Public/icons/LUCIDE-LICENSE.txt`.

## Installation

This repository is the FreeScout module. It belongs in `Modules/IconPicker`. In this setup that is `/data/Modules/IconPicker`.

```bash
docker cp . freescout-app:/data/Modules/IconPicker
docker exec -w /www/html freescout-app php artisan module:enable IconPicker
docker exec -w /www/html freescout-app php artisan freescout:module-install iconpicker
```

`freescout:module-install` creates the public symlink and runs the migration.

The container has no Node. `Public/js/module.js` is the built file shipped with the module. After changing the TypeScript source, build it on the host with `npm run build`.

## Rollback

Turn the module off. Glyphicons that were already set stay. Lucide icons and emoji disappear, because their Glyphicon name is empty. The `folder_icon` table can stay.

```bash
docker exec -w /www/html freescout-app php artisan module:disable iconpicker
```

## UpdateGuard

[UpdateGuard](https://github.com/00MY00/UpdateGuard) checks the module from the fields in `module.json`.

The read-only check is `iconpicker:health`:

```bash
php artisan iconpicker:health
php artisan iconpicker:health --json
```

Exit code 0 means healthy, exit code 1 does not. The command does not write, does not migrate, and does not open an outbound connection. If the Glyphicon copy differs from the list Custom Folders accepts, the status is `fail`.

`version.txt` on `main` is the version line. Release 0.1 publishes `IconPicker.zip`. `scripts/sha256sums.sh` writes `SHA256SUMS` in GNU format `<64 hex>  IconPicker.zip` and rejects any other filename. The workflow `.github/workflows/sha256sums.yml` attaches that file to a release that already contains `IconPicker.zip`.
