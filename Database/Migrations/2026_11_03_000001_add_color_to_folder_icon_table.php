<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColorToFolderIconTable extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('folder_icon') || Schema::hasColumn('folder_icon', 'color')) {
            return;
        }
        Schema::table('folder_icon', function (Blueprint $table) {
            $table->string('color', 7)->nullable();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('folder_icon') || !Schema::hasColumn('folder_icon', 'color')) {
            return;
        }
        Schema::table('folder_icon', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
}
