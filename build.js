const fs = require("fs-extra");
const shell = require("shelljs");
// console.log(process.argv);
process.env.path += ";./node_modules/.bin";

let args = process.argv.slice(3);
if ( args.filter(i => i === "compile=debug")[0] ) {
	debug();
} else if ( args.filter(i => i === "compile=release")[0] ) {
	release();
}
if ( args.includes("libs") ) libs();

// theme
if ( args.includes("theme") ) { themeIcons(); themeCss(); }
if ( args.filter(i => i === "theme=icons")[0] ) themeIcons();
if ( args.filter(i => i === "theme=css")[0] ) themeCss();


function libs() {
	require("./libs.js").forEach(i => {
		shell.cp("-r", `./node_modules/${i}`, "./src/lib/");
	});
};

function debug() {
	const INP = "./src";
	const OUT = "./dist";
	const ROOT = "";
	
	shell.rm("-rf", OUT);
	shell.mkdir("-p", OUT+"/css", OUT+"/js");
	shell.cp("-r", INP+"/lib", INP+"/images", INP+"/fonts", OUT);
	shell.mv(OUT+"/images/favicon.ico", OUT);

	fs.writeFileSync(INP+"/html/links/root.htm",           ROOT,                "utf8");
	fs.writeFileSync(INP+"/html/scripts/root.htm",         ROOT,                "utf8");
	fs.writeFileSync(INP+"/html/scripts/app/root.htm",     ROOT,                "utf8");
	fs.writeFileSync(INP+"/html/scripts/app/filename.htm", "main.js",           "utf8");
	fs.writeFileSync(INP+"/js/core/root.js",               "export default '';", "utf8");

	shell.exec(`htmlbilder ${INP}/html/ -o ${OUT}/index.html`);
	shell.exec(`handlebars ${INP}/templates/template/ -f ${OUT}/js/templates.js -e hbs -m -o`);
	shell.exec(`handlebars ${INP}/templates/partial/ -f ${OUT}/js/partials.js -p -e hbs -m -o`);
	shell.exec(`babel ${INP}/js/ -d ${OUT}/js -s`);
	shell.exec(`chcp 1252 && sass ${INP}/sass/style.scss:${OUT}/css/style.css --style expanded --sourcemap=auto`);
}

function release() {
	const INP = "./src";
	const OUT = "./release/static";
	const ROOT = "/static/";
	const FL = "app.bundle.js";
	
	shell.rm("-rf", OUT);
	shell.mkdir("-p", OUT+"/css", OUT+"/js");
	shell.cp("-r", INP+"/lib", INP+"/images", INP+"/fonts", OUT);
	shell.mv(OUT+"/images/favicon.ico", OUT);

	fs.writeFileSync(INP+"/html/links/root.htm",           ROOT,                       "utf8");
	fs.writeFileSync(INP+"/html/scripts/root.htm",         ROOT,                       "utf8");
	fs.writeFileSync(INP+"/html/scripts/app/root.htm",     ROOT,                       "utf8");
	fs.writeFileSync(INP+"/html/scripts/app/filename.htm", FL,                         "utf8");
	fs.writeFileSync(INP+"/js/core/root.js",               "export default '${ROOT}';", "utf8");

	shell.exec(`htmlbilder ${INP}/html/ -o ./release/index.html`);
	
	const TEMPLATES_FILE = `${OUT}/js/templates.tmp.js`;
	const PARTIALS_FILE = `${OUT}/js/partials.tmp.js`;
	shell.exec(`handlebars ${INP}/templates/template/ -f ${TEMPLATES_FILE} -e hbs -m -o`);
	shell.exec(`handlebars ${INP}/templates/partial/ -f ${PARTIALS_FILE} -p -e hbs -m -o`);
	fs.writeFileSync(`${OUT}/js/templates.js`, shell.cat(TEMPLATES_FILE, PARTIALS_FILE), "utf8");
	shell.rm("-rf", TEMPLATES_FILE, PARTIALS_FILE);
	
	const TMP = `${OUT}/js/app.unbabeled.js`;
	shell.exec(`r_js -o baseUrl=${INP}/js/ name=main out=${TMP} optimize=none`);
	shell.exec(`babel ${TMP} -o ${OUT}/js/${FL} --minified`); // --minified
	shell.rm("-rf", TMP);
	shell.cp("-r", `${INP}/js/workers/`, `${OUT}/js/`);
	
	shell.exec(`node-sass ${INP}/sass/style.scss > ${OUT}/css/style.css --output-style compressed`);
}

function themeCss() {
	shell.rm("-f", "./dist/lib/uikit-rtl.css");
	shell.cd("./src/theme/");
	shell.exec("node-sass site.scss > theme.css --output-style expanded");
	shell.exec("rtlcss theme.css ../../dist/lib/uikit-rtl.css");
	shell.rm("-f", "theme.css");
	shell.cd("../../");
	shell.cp("-f", "./dist/lib/uikit-rtl.css", "./uk/dist/css/");
}

function themeIcons() {
	shell.rm("-f", "./dist/lib/uikit-icons.js");
	shell.rm("-rf", "./uk/custom/icons/");
	shell.mkdir("-p", "./uk/custom/icons/");
	shell.cp("-r", "./src/theme/icons/*", "./uk/custom/icons/");
	shell.cd("uk");
	shell.exec("npm run compile");
	shell.cp("dist/js/uikit-icons.js", "../dist/lib/");
	shell.cd("../");
	shell.cp("-f", "./dist/lib/uikit-icons.js", "./uk/dist/js/");
}