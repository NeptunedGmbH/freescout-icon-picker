<?php

namespace Modules\IconPicker\Providers;

use App\Conversation;
use App\Mailbox;
use Illuminate\Support\ServiceProvider;
use Modules\IconPicker\Support\FolderIcons;

class IconPickerServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/../Config/config.php', 'iconpicker');
        $this->commands(array(
            \Modules\IconPicker\Console\HealthCommand::class,
        ));
    }

    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadJsonTranslationsFrom(__DIR__.'/../Resources/lang');
        $this->hooks();
    }

    protected function hooks()
    {
        if (!self::customFoldersReady()) {
            return;
        }

        \Eventy::addFilter('stylesheets', function ($styles) {
            $styles[] = \Module::getPublicPath('iconpicker').'/css/module.css';

            return $styles;
        }, 20, 1);

        \Eventy::addFilter('javascripts', function ($javascripts) {
            $javascripts[] = \Module::getPublicPath('iconpicker').'/js/laroute.js';
            $javascripts[] = \Module::getPublicPath('iconpicker').'/js/module.js';

            return $javascripts;
        }, 20, 1);

        \Eventy::addAction('javascript', function () {
            if (!\Auth::check()) {
                return;
            }
            try {
                $url = route('iconpicker.ajax');
            } catch (\Throwable $e) {
                return;
            }
            $mailboxId = self::mailboxId();
            $icons = new \stdClass();
            if ($mailboxId > 0) {
                try {
                    $loaded = FolderIcons::map($mailboxId);
                    if ($loaded) {
                        $icons = $loaded;
                    }
                } catch (\Throwable $e) {
                    $icons = new \stdClass();
                }
            }
            $boot = array(
                'url' => $url,
                'base' => \Module::getPublicPath('iconpicker'),
                'mailboxId' => $mailboxId,
                'icons' => $icons,
                'failed' => __('Invalid :field', array('field' => __('Icon'))),
            );
            echo 'iconpickerStart('.json_encode($boot, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).');';
        }, 20, 0);
    }

    /**
     * @return int
     */
    private static function mailboxId()
    {
        $user = \Auth::user();
        if (!$user) {
            return 0;
        }
        $name = '';
        try {
            $route = request()->route();
            $name = $route ? (string) $route->getName() : '';
        } catch (\Throwable $e) {
            $name = '';
        }
        $mailboxId = 0;
        if (strpos($name, 'mailboxes.') === 0) {
            $mailboxId = (int) (request()->route('mailbox_id') ?: request()->route('id') ?: 0);
        } elseif ($name === 'conversations.view') {
            try {
                $conversation = Conversation::find(request()->route('id'));
            } catch (\Throwable $e) {
                $conversation = null;
            }
            if ($conversation && $user->can('view', $conversation)) {
                $mailboxId = (int) $conversation->mailbox_id;
            }
        }
        if ($mailboxId <= 0) {
            return 0;
        }
        $mailbox = Mailbox::find($mailboxId);
        if (!$mailbox || !$user->can('view', $mailbox)) {
            return 0;
        }

        return $mailboxId;
    }

    /**
     * Official Custom Folders must be on, with its license marked activated.
     * The license key is never read.
     *
     * @return bool
     */
    public static function customFoldersReady()
    {
        try {
            if (!\App\Module::isActive('customfolders')) {
                return false;
            }
            $module = \App\Module::getByAlias('customfolders');
        } catch (\Exception $e) {
            return false;
        }

        return $module && !empty($module->activated);
    }
}
