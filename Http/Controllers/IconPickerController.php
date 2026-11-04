<?php

namespace Modules\IconPicker\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\IconPicker\Support\FolderIcons;

class IconPickerController extends Controller
{
    public function ajax(Request $request)
    {
        $action = (string) $request->input('action');
        $folderId = (int) $request->input('folder_id');
        $mailboxId = (int) $request->input('mailbox_id');

        if ($action === 'delete') {
            $error = FolderIcons::delete($folderId, $mailboxId);
        } else {
            $stored = FolderIcons::store(
                $folderId,
                $mailboxId,
                (string) $request->input('kind'),
                (string) $request->input('value'),
                (string) $request->input('color')
            );
            $error = $stored['error'];
        }

        if ($error !== null) {
            return \Response::json(array(
                'status' => 'error',
                'msg' => $this->message($error),
            ));
        }

        if ($mailboxId < 1 && $folderId > 0) {
            $folder = \App\Folder::find($folderId);
            if ($folder) {
                $mailboxId = (int) $folder->mailbox_id;
            }
        }
        if ($mailboxId > 0 && class_exists(\Modules\NestedTags\Events\FolderSidebarRefresh::class)) {
            \Modules\NestedTags\Events\FolderSidebarRefresh::send($mailboxId);
        }

        return \Response::json(array(
            'status' => 'success',
        ));
    }

    /**
     * @param string $error
     * @return string
     */
    private function message($error)
    {
        if ($error === 'forbidden') {
            return __('Not enough permissions');
        }
        if ($error === 'mailbox') {
            return __('Invalid :field', array('field' => __('Mailbox')));
        }
        if ($error === 'catalog') {
            return __('Invalid :field', array('field' => __('Icon')));
        }

        return __('Folder not found');
    }
}
