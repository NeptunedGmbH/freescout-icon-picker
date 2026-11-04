<?php

namespace Modules\IconPicker\Support;

use App\Folder;
use App\Mailbox;

/**
 * Liest und schreibt folder_icon. Eine Zeile ohne Ordner fällt beim Lesen weg.
 */
class FolderIcons
{
    /**
     * Revision just written in this request. Option::set does not refresh its cache.
     *
     * @var array<int, int>
     */
    private static $bumped = array();

    /**
     * @param int $mailboxId
     * @return int
     */
    public static function revision($mailboxId)
    {
        $mailboxId = (int) $mailboxId;
        if ($mailboxId < 1) {
            return 0;
        }
        if (isset(self::$bumped[$mailboxId])) {
            return self::$bumped[$mailboxId];
        }

        return (int) \Option::get(self::revisionName($mailboxId), 0);
    }

    /**
     * @param int $mailboxId
     * @return int
     */
    public static function bump($mailboxId)
    {
        $mailboxId = (int) $mailboxId;
        if ($mailboxId < 1) {
            return 0;
        }
        $next = self::revision($mailboxId) + 1;
        \Option::set(self::revisionName($mailboxId), (string) $next);
        self::$bumped[$mailboxId] = $next;

        return $next;
    }

    /**
     * @param int $mailboxId
     * @return array<int, array{kind:string,value:string}>
     */
    public static function map($mailboxId)
    {
        self::prune();
        $mailboxId = (int) $mailboxId;
        if ($mailboxId <= 0) {
            return array();
        }
        $folderIds = Folder::where('mailbox_id', $mailboxId)
            ->where('type', IconPlan::TYPE_CUSTOM)
            ->pluck('id')
            ->all();
        if (!$folderIds) {
            return array();
        }
        $rows = \DB::table('folder_icon')->whereIn('folder_id', $folderIds)->get();
        $map = array();
        foreach ($rows as $row) {
            $map[(int) $row->folder_id] = array(
                'kind' => (string) $row->kind,
                'value' => (string) $row->value,
                'color' => isset($row->color) ? (string) $row->color : '',
            );
        }

        return $map;
    }

    /**
     * @param int $folderId
     * @param int $mailboxId
     * @param string $kind
     * @param string $value
     * @return array error or null, and whether the select stays
     */
    public static function store($folderId, $mailboxId, $kind, $value, $color = '')
    {
        $built = self::folder((int) $folderId);
        if ($built === null) {
            return array('error' => 'folder', 'select' => 'keep');
        }
        $allowed = self::allowed((int) $built['mailbox_id']);
        if ((string) $value === '') {
            $choice = array('kind' => 'clear', 'value' => '');
        } else {
            $choice = Catalog::accept($kind, $value, Catalog::read(self::iconsDirectory()));
            if ($choice === null) {
                return array('error' => 'catalog', 'select' => 'keep');
            }
            $choice['color'] = (string) $color;
        }
        $rows = self::rows();
        $result = IconPlan::save($rows, $built, (int) $mailboxId, $allowed, $choice);
        $revision = 0;
        if ($result['error'] === null) {
            self::write($rows, $result['rows']);
            $revision = self::bump((int) $built['mailbox_id']);
        }

        return array(
            'error' => $result['error'],
            'select' => $result['select'],
            'revision' => $revision,
        );
    }

    /**
     * @param int $folderId
     * @param int $mailboxId
     * @return string|null
     */
    public static function delete($folderId, $mailboxId)
    {
        $built = self::folder((int) $folderId);
        if ($built === null) {
            $built = array('exists' => false, 'id' => (int) $folderId, 'type' => 0, 'mailbox_id' => 0);
            $allowed = self::allowed((int) $mailboxId);
        } else {
            $allowed = self::allowed((int) $built['mailbox_id']);
        }
        $rows = self::rows();
        $result = IconPlan::remove($rows, $built, (int) $mailboxId, $allowed);
        if ($result['error'] === null) {
            self::write($rows, $result['rows']);
            $bumpId = (int) $built['mailbox_id'];
            if ($bumpId < 1) {
                $bumpId = (int) $mailboxId;
            }
            if ($bumpId > 0) {
                self::bump($bumpId);
            }
        }

        return $result['error'];
    }

    public static function prune()
    {
        $rowIds = array();
        foreach (\DB::table('folder_icon')->pluck('folder_id') as $id) {
            $rowIds[] = (int) $id;
        }
        if (!$rowIds) {
            return;
        }
        $live = array();
        foreach (Folder::whereIn('id', $rowIds)->pluck('id') as $id) {
            $live[] = (int) $id;
        }
        $gone = IconPlan::missing($rowIds, $live);
        if ($gone) {
            \DB::table('folder_icon')->whereIn('folder_id', $gone)->delete();
        }
    }

    /**
     * @param int $folderId
     * @return array|null
     */
    private static function folder($folderId)
    {
        $folder = Folder::find($folderId);
        if (!$folder) {
            return null;
        }

        return array(
            'exists' => true,
            'id' => (int) $folder->id,
            'type' => (int) $folder->type,
            'mailbox_id' => (int) $folder->mailbox_id,
        );
    }

    /**
     * @param int $mailboxId
     * @return bool
     */
    private static function allowed($mailboxId)
    {
        if ($mailboxId <= 0 || !class_exists('CustomFolder')) {
            return false;
        }
        $mailbox = Mailbox::find($mailboxId);
        if (!$mailbox) {
            return false;
        }

        return \CustomFolder::canUserUpdateMailboxCustomFolders($mailbox) ? true : false;
    }

    /**
     * @return array
     */
    private static function rows()
    {
        $rows = array();
        foreach (\DB::table('folder_icon')->get() as $row) {
            $rows[(int) $row->folder_id] = array(
                'kind' => (string) $row->kind,
                'value' => (string) $row->value,
                'color' => isset($row->color) ? (string) $row->color : '',
            );
        }

        return $rows;
    }

    /**
     * @param array $before
     * @param array $after
     */
    private static function write(array $before, array $after)
    {
        foreach ($before as $id => $row) {
            if (!isset($after[$id])) {
                \DB::table('folder_icon')->where('folder_id', (int) $id)->delete();
            }
        }
        foreach ($after as $id => $row) {
            $previous = isset($before[$id]) ? $before[$id] : null;
            if ($previous === $row) {
                continue;
            }
            $query = \DB::table('folder_icon')->where('folder_id', (int) $id);
            $payload = array(
                'kind' => $row['kind'],
                'value' => $row['value'],
                'color' => !empty($row['color']) ? $row['color'] : null,
            );
            if ($query->count() > 0) {
                \DB::table('folder_icon')->where('folder_id', (int) $id)->update($payload);
            } else {
                $payload['folder_id'] = (int) $id;
                \DB::table('folder_icon')->insert($payload);
            }
        }
    }

    /**
     * @return string
     */
    private static function iconsDirectory()
    {
        return dirname(__DIR__).'/Public/icons';
    }

    /**
     * @param int $mailboxId
     * @return string
     */
    private static function revisionName($mailboxId)
    {
        return 'iconpicker.revision.'.(int) $mailboxId;
    }
}
