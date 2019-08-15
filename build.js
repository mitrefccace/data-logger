const path = require('path');
var fs = require('fs');


const CSS = [
    'admin-lte/dist/css/AdminLTE.min.css',
    'admin-lte/dist/css/skins/skin-blue.min.css',
    'admin-lte/plugins/bootstrap-slider/slider.css',
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-daterangepicker/daterangepicker.css',
    'ionicons/dist/css/ionicons.min.css',
    'font-awesome/css/font-awesome.min.css',
    'datatables.net-jqui/css/dataTables.jqueryui.css',
    'datatables.net-bs4/css/dataTables.bootstrap4.min.css',
];
const FONT = [
    //'bootstrap/dist/fonts/glyphicons-halflings-regular.woff',
    //'bootstrap/dist/fonts/glyphicons-halflings-regular.woff2',
    'font-awesome/fonts/fontawesome-webfont.woff2'
];

const JS = [
    'admin-lte/dist/js/adminlte.min.js',
    'admin-lte/plugins/bootstrap-slider/bootstrap-slider.js',
    'admin-lte/plugins/jQueryUI/jquery-ui.min.js',
    'bootstrap/dist/js/bootstrap.js',
    'bootstrap-daterangepicker/daterangepicker.js',
    'datatables.net/js/jquery.dataTables.min.js',
    'datatables.net-jqui/js/dataTables.jqueryui.js',
    'datatables.net-bs4/js/dataTables.bootstrap4.min.js',
    'jquery/dist/jquery.min.js',
    'jquery-form-validator/form-validator/jquery.form-validator.min.js',
    'jquery-form-validator/form-validator/toggleDisabled.js',
    'moment/moment.js'
];


if (!fs.existsSync('./public/assets')) {
    fs.mkdirSync('./public/assets');
}
if (!fs.existsSync('./public/assets/js')) {
    fs.mkdirSync('./public/assets/js');
}
if (!fs.existsSync('./public/assets/css')) {
    fs.mkdirSync('./public/assets/css');
}
if (!fs.existsSync('./public/assets/fonts')) {
    fs.mkdirSync('./public/assets/fonts');
}
JS.map(asset => {
    let filename = asset.substring(asset.lastIndexOf("/") + 1);
    let from = path.resolve(__dirname, `./node_modules/${asset}`)
    let to = path.resolve(__dirname, `./public/assets/js/${filename}`)
    if (fs.existsSync(from)) {
        fs.createReadStream(from).pipe(fs.createWriteStream(to));
    } else {
        console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
        process.exit(1)
    }
});

CSS.map(asset => {
    let filename = asset.substring(asset.lastIndexOf("/") + 1);
    let from = path.resolve(__dirname, `./node_modules/${asset}`)
    let to = path.resolve(__dirname, `./public/assets/css/${filename}`)
    if (fs.existsSync(from)) {
        fs.createReadStream(from).pipe(fs.createWriteStream(to));
    } else {
        console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
        process.exit(1)
    }
});

FONT.map(asset => {
    let filename = asset.substring(asset.lastIndexOf("/") + 1);
    let from = path.resolve(__dirname, `./node_modules/${asset}`)
    let to = path.resolve(__dirname, `./public/assets/fonts/${filename}`)
    if (fs.existsSync(from)) {
        fs.createReadStream(from).pipe(fs.createWriteStream(to));
    } else {
        console.log(`${from} does not exist.\nUpdate the build.js script with the correct file paths.`)
        process.exit(1)
    }
});
