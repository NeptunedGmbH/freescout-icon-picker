<?php

Route::group(['middleware' => 'web', 'prefix' => \Helper::getSubdirectory(), 'namespace' => 'Modules\IconPicker\Http\Controllers'], function () {
    Route::post('/iconpicker/ajax', [
        'uses' => 'IconPickerController@ajax',
        'middleware' => ['auth', 'roles'],
        'roles' => ['admin', 'user'],
        'laroute' => true,
    ])->name('iconpicker.ajax');
});
