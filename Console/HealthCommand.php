<?php

namespace Modules\IconPicker\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Modules\IconPicker\Support\Catalog;

/**
 * Read-only health check for UpdateGuard.
 *
 *   php artisan iconpicker:health
 *   php artisan iconpicker:health --json
 *
 * Exit 0 means healthy. Exit 1 means unhealthy.
 * The command does not write, migrate, or use the network.
 */
class HealthCommand extends Command
{
    protected $signature = 'iconpicker:health {--json : Print a JSON object}';

    protected $description = 'Read-only IconPicker health check (UpdateGuard)';

    public function handle()
    {
        $root = dirname(__DIR__);
        $checks = array(
            'files' => $this->files($root),
            'classes' => $this->classes(),
            'routes' => $this->routes(),
            'database' => $this->database(),
            'assets' => $this->assets(),
            'version' => $this->versionMatches($root),
            'interop' => $this->interop($root),
            'glyphs' => $this->glyphs($root),
            'customfolders' => $this->customFolders(),
        );
        $version = $this->version($root);
        $failed = 0;
        foreach ($checks as $result) {
            if ($result !== 'ok') {
                $failed++;
            }
        }
        $status = $failed === 0 ? 'ok' : 'fail';
        $payload = array(
            'status' => $status,
            'module' => 'IconPicker',
            'version' => $version,
            'checks' => $checks,
        );
        if ($this->option('json')) {
            $encoded = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($encoded === false) {
                $this->line('{"status":"fail","module":"IconPicker","version":"","checks":{"json":"encode failed"}}');

                return 1;
            }
            $this->line($encoded);

            return $failed === 0 ? 0 : 1;
        }
        foreach ($checks as $name => $result) {
            $this->line(str_pad($name, 12).$result);
        }
        $this->line('IconPicker '.$version.': '.$status);

        return $failed === 0 ? 0 : 1;
    }

    protected function files($root)
    {
        $relative = array(
            'module.json',
            'start.php',
            'version.txt',
            'interop.json',
            'Config/config.php',
            'Providers/IconPickerServiceProvider.php',
            'Http/routes.php',
            'Http/Controllers/IconPickerController.php',
            'Support/Catalog.php',
            'Support/IconPlan.php',
            'Support/FolderIcons.php',
            'Console/HealthCommand.php',
            'Public/css/module.css',
            'Public/js/module.js',
            'Public/js/laroute.js',
            'Public/icons/glyphs.json',
            'Public/icons/aliases.json',
            'Public/icons/lucide.json',
            'Public/icons/emoji.json',
            'Public/icons/LUCIDE-LICENSE.txt',
            'Database/Migrations/2026_11_03_000000_create_folder_icon_table.php',
        );
        $missing = array();
        foreach ($relative as $path) {
            $full = $root.'/'.$path;
            if (!is_file($full) || !is_readable($full)) {
                $missing[] = $path;
            }
        }

        return $missing ? 'missing '.implode(', ', $missing) : 'ok';
    }

    protected function classes()
    {
        $classes = array(
            'Modules\\IconPicker\\Providers\\IconPickerServiceProvider',
            'Modules\\IconPicker\\Http\\Controllers\\IconPickerController',
            'Modules\\IconPicker\\Support\\Catalog',
            'Modules\\IconPicker\\Support\\IconPlan',
            'Modules\\IconPicker\\Support\\FolderIcons',
            'Modules\\IconPicker\\Console\\HealthCommand',
        );
        $missing = array();
        foreach ($classes as $class) {
            if (!class_exists($class)) {
                $missing[] = $class;
            }
        }

        return $missing ? 'missing '.implode(', ', $missing) : 'ok';
    }

    protected function routes()
    {
        try {
            $exists = Route::has('iconpicker.ajax');
        } catch (\Throwable $e) {
            $exists = false;
        }

        return $exists ? 'ok' : 'missing iconpicker.ajax';
    }

    protected function database()
    {
        try {
            if (!Schema::hasTable('folder_icon')) {
                return 'folder_icon missing';
            }
            if (!Schema::hasColumn('folder_icon', 'folder_id')
                || !Schema::hasColumn('folder_icon', 'kind')
                || !Schema::hasColumn('folder_icon', 'value')
            ) {
                return 'folder_icon columns missing';
            }
            \DB::table('folder_icon')->select(array('folder_id', 'kind', 'value'))->limit(1)->get();
        } catch (\Throwable $e) {
            return 'folder_icon query failed';
        }

        return 'ok';
    }

    protected function assets()
    {
        $relative = array('css/module.css', 'js/module.js', 'icons/glyphs.json', 'icons/lucide.json', 'icons/emoji.json');
        $missing = array();
        foreach ($relative as $path) {
            try {
                $full = public_path('modules/iconpicker/'.$path);
                $readable = is_file($full) && is_readable($full);
            } catch (\Throwable $e) {
                $readable = false;
            }
            if (!$readable) {
                $missing[] = 'modules/iconpicker/'.$path;
            }
        }

        return $missing ? 'missing '.implode(', ', $missing) : 'ok';
    }

    protected function versionMatches($root)
    {
        $version = $this->version($root);
        $file = trim((string) @file_get_contents($root.'/version.txt'));
        if ($version === '' || $file === '' || $version !== $file) {
            return 'version.txt does not match module.json';
        }

        return 'ok';
    }

    protected function interop($root)
    {
        $doc = json_decode((string) @file_get_contents($root.'/interop.json'), true);
        if (!is_array($doc) || !isset($doc['project']['id']) || $doc['project']['id'] !== 'icon-picker') {
            return 'interop.json missing project id icon-picker';
        }
        if (empty($doc['compatibility']['freescout']) || empty($doc['compatibility']['projects'])) {
            return 'interop.json missing compatibility';
        }

        return 'ok';
    }

    protected function glyphs($root)
    {
        try {
            $live = config('customfolders.icons');
        } catch (\Throwable $e) {
            return 'customfolders icons unavailable';
        }
        if (!is_array($live)) {
            return 'customfolders icons unavailable';
        }
        $copy = Catalog::read($root.'/Public/icons');
        $glyphs = isset($copy['glyphs']) && is_array($copy['glyphs']) ? $copy['glyphs'] : array();
        if (!Catalog::sameGlyphs($glyphs, array_values($live))) {
            return 'glyph list differs from customfolders';
        }

        return 'ok';
    }

    protected function version($root)
    {
        $manifest = json_decode((string) @file_get_contents($root.'/module.json'), true);
        if (!is_array($manifest) || !isset($manifest['version'])) {
            return '';
        }

        return (string) $manifest['version'];
    }

    /**
     * Official Custom Folders must be active and its license marked activated.
     *
     * @return string
     */
    protected function customFolders()
    {
        try {
            if (!\App\Module::isActive('customfolders')) {
                return 'customfolders inactive';
            }
            $module = \App\Module::getByAlias('customfolders');
        } catch (\Exception $e) {
            return 'customfolders unavailable';
        }
        if (!$module || empty($module->activated)) {
            return 'customfolders license inactive';
        }

        return 'ok';
    }
}
