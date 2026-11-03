<?php

namespace Modules\IconPicker\Support;

/**
 * Entscheidet, was mit der Extra-Zeile eines Ordners passiert.
 * Glyphicons bleiben im Select von Custom Folders. Diese Klasse schreibt meta nicht.
 */
class IconPlan
{
    const TYPE_CUSTOM = 200;

    /**
     * @param array $rows folder id => kind, value
     * @param array $folder exists, id, type, mailbox_id
     * @param int $requestMailbox
     * @param bool $allowed
     * @param array $choice kind glyph|lucide|emoji|clear, value
     * @return array error, rows, select keep|clear
     */
    public static function save(array $rows, array $folder, $requestMailbox, $allowed, array $choice)
    {
        $id = (int) ($folder['id'] ?? 0);
        $error = self::guard($folder, $requestMailbox, $allowed, true);
        if ($error !== null) {
            return array('error' => $error, 'rows' => $rows, 'select' => 'keep');
        }

        $kind = (string) ($choice['kind'] ?? '');
        if ($kind === 'glyph') {
            $color = self::color(isset($choice['color']) ? $choice['color'] : '');
            if ($color === '') {
                unset($rows[$id]);
            } else {
                $rows[$id] = array(
                    'kind' => 'glyph',
                    'value' => (string) ($choice['value'] ?? ''),
                    'color' => $color,
                );
            }

            return array('error' => null, 'rows' => $rows, 'select' => 'keep');
        }

        if ($kind === 'lucide' || $kind === 'emoji') {
            $rows[$id] = array(
                'kind' => $kind,
                'value' => (string) ($choice['value'] ?? ''),
                'color' => $kind === 'lucide' ? self::color(isset($choice['color']) ? $choice['color'] : '') : '',
            );

            return array('error' => null, 'rows' => $rows, 'select' => 'clear');
        }

        if ($kind === 'clear') {
            unset($rows[$id]);

            return array('error' => null, 'rows' => $rows, 'select' => 'clear');
        }

        return array('error' => 'catalog', 'rows' => $rows, 'select' => 'keep');
    }

    /**
     * @param array $rows
     * @param array $folder
     * @param int $requestMailbox
     * @param bool $allowed
     * @return array
     */
    public static function remove(array $rows, array $folder, $requestMailbox, $allowed)
    {
        $id = (int) ($folder['id'] ?? 0);
        if (empty($folder['exists'])) {
            if (!$allowed || (int) $requestMailbox <= 0 || $id <= 0) {
                return array('error' => 'forbidden', 'rows' => $rows, 'select' => 'keep');
            }
            unset($rows[$id]);

            return array('error' => null, 'rows' => $rows, 'select' => 'keep');
        }

        $error = self::guard($folder, $requestMailbox, $allowed, true);
        if ($error !== null) {
            return array('error' => $error, 'rows' => $rows, 'select' => 'keep');
        }
        unset($rows[$id]);

        return array('error' => null, 'rows' => $rows, 'select' => 'keep');
    }

    /**
     * Zeilen, deren Ordner fehlt.
     *
     * @param array $rowIds
     * @param array $liveIds
     * @return array
     */
    public static function missing(array $rowIds, array $liveIds)
    {
        $live = array();
        foreach ($liveIds as $id) {
            $live[(int) $id] = true;
        }
        $gone = array();
        foreach ($rowIds as $id) {
            $id = (int) $id;
            if ($id > 0 && !isset($live[$id])) {
                $gone[] = $id;
            }
        }

        return $gone;
    }

    /**
     * @param array $folder
     * @param int $requestMailbox
     * @param bool $allowed
     * @param bool $mustExist
     * @return string|null
     */
    private static function guard(array $folder, $requestMailbox, $allowed, $mustExist)
    {
        if ($mustExist && empty($folder['exists'])) {
            return 'folder';
        }
        if ((int) ($folder['type'] ?? 0) !== self::TYPE_CUSTOM) {
            return 'folder';
        }
        $mailboxId = (int) ($folder['mailbox_id'] ?? 0);
        if ($mailboxId <= 0 || $mailboxId !== (int) $requestMailbox) {
            return 'mailbox';
        }
        if (!$allowed) {
            return 'forbidden';
        }

        return null;
    }

    /**
     * @param string $value
     * @return string
     */
    private static function color($value)
    {
        $value = strtolower(trim((string) $value));
        if (preg_match('/^#[0-9a-f]{6}$/', $value)) {
            return $value;
        }

        return '';
    }
}
