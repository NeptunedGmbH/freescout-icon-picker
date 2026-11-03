<?php

require __DIR__.'/../Support/IconPlan.php';

use Modules\IconPicker\Support\IconPlan;

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

$folder = array('exists' => true, 'id' => 5, 'type' => IconPlan::TYPE_CUSTOM, 'mailbox_id' => 2);
$rows = array(5 => array('kind' => 'lucide', 'value' => 'star'));

$glyph = IconPlan::save($rows, $folder, 2, true, array('kind' => 'glyph', 'value' => 'lock'));
expect('glyph deletes row', !isset($glyph['rows'][5]) && $glyph['error'] === null);
expect('glyph keeps select', $glyph['select'] === 'keep');

$lucide = IconPlan::save(array(), $folder, 2, true, array('kind' => 'lucide', 'value' => 'star', 'color' => '#E74C3C'));
expect('lucide writes row', isset($lucide['rows'][5]) && $lucide['rows'][5]['kind'] === 'lucide' && $lucide['rows'][5]['value'] === 'star');
expect('lucide keeps color', $lucide['rows'][5]['color'] === '#e74c3c');
$plain = IconPlan::save(array(), $folder, 2, true, array('kind' => 'lucide', 'value' => 'star', 'color' => 'red'));
expect('lucide drops invalid color', $plain['rows'][5]['color'] === '');
expect('lucide clears select', $lucide['select'] === 'clear');

$emoji = IconPlan::save(array(), $folder, 2, true, array('kind' => 'emoji', 'value' => '📁'));
expect('emoji writes row', isset($emoji['rows'][5]) && $emoji['rows'][5]['kind'] === 'emoji' && $emoji['rows'][5]['value'] === '📁');

$denied = IconPlan::save($rows, $folder, 2, false, array('kind' => 'emoji', 'value' => '📁'));
expect('without right', $denied['error'] === 'forbidden' && isset($denied['rows'][5]));

$system = IconPlan::save(array(), array('exists' => true, 'id' => 1, 'type' => 1, 'mailbox_id' => 2), 2, true, array('kind' => 'emoji', 'value' => '📁'));
expect('system folder', $system['error'] === 'folder' && $system['rows'] === array());

$foreign = IconPlan::save(array(), $folder, 9, true, array('kind' => 'emoji', 'value' => '📁'));
expect('other mailbox', $foreign['error'] === 'mailbox');

$gone = IconPlan::missing(array(5, 9), array(5));
expect('missing folder row', $gone === array(9));

$removed = IconPlan::remove($rows, array('exists' => false, 'id' => 5, 'type' => 0, 'mailbox_id' => 0), 2, true);
expect('delete after folder is gone', !isset($removed['rows'][5]) && $removed['error'] === null);

exit($failed === 0 ? 0 : 1);
