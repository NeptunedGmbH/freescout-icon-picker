(function () {
    var module_routes = [
    {
        "uri": "iconpicker/ajax",
        "name": "iconpicker.ajax"
    }
];

    if (typeof(laroute) != "undefined") {
        laroute.add_routes(module_routes);
    } else {
        console.log('laroute not initialized, can not add module routes:');
        console.log(module_routes);
    }
})();
