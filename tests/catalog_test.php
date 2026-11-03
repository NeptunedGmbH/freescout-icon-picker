<?php

require __DIR__.'/../Support/Catalog.php';

use Modules\IconPicker\Support\Catalog;

$failed = 0;

function expect($label, $condition)
{
    global $failed;
    if ($condition) {
        echo "ok  $label\n";

        return;
    }
    echo "FAIL $label\n";
    $failed++;
}

$directory = dirname(__DIR__).'/Public/icons';
$catalog = Catalog::read($directory);
$lock = Catalog::accept('glyph', 'lock', $catalog);
$alias = Catalog::accept('glyph', 'schloss', $catalog);

expect('lock', is_array($lock) && $lock['kind'] === 'glyph' && $lock['value'] === 'lock');
expect('schloss', is_array($alias) && $alias['kind'] === 'glyph' && $alias['value'] === 'lock');
expect('foreign lucide', Catalog::accept('lucide', 'not-a-real-lucide-icon', $catalog) === null);
expect('foreign emoji', Catalog::accept('emoji', 'not-an-emoji', $catalog) === null);
expect('markup', Catalog::accept('lucide', '<svg onload=1>', $catalog) === null);
expect('quoted markup', Catalog::accept('glyph', 'lock" onclick="1', $catalog) === null);

$files = scandir($directory);
foreach ($files as $name) {
    if ($name === '.' || $name === '..') {
        continue;
    }
    $text = (string) file_get_contents($directory.'/'.$name);
    expect('no http in '.$name, stripos($text, 'http') === false);
}

expect('glyph lists match themselves', Catalog::sameGlyphs($catalog['glyphs'], $catalog['glyphs']));
expect('glyph drift', Catalog::sameGlyphs($catalog['glyphs'], array('lock')) === false);

exit($failed === 0 ? 0 : 1);
