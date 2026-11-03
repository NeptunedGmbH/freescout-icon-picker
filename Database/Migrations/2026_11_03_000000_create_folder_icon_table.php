<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFolderIconTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('folder_icon')) {
            return;
        }
        Schema::create('folder_icon', function (Blueprint $table) {
            $table->unsignedInteger('folder_id')->primary();
            $table->string('kind', 16);
            $table->string('value', 64);
        });
    }

    public function down()
    {
        Schema::dropIfExists('folder_icon');
    }
}
