const esbuild= require('esbuild');
const fs= require('fs');

const exists = fs.existsSync('src/config.local.ts');
if (!exists) {
	console.log('ATTENTION: the required src/config.local.ts has not been found, creating the new one...');
	const configFile =
		'export class ConfigLocal {\n' +
		'	public static functionsHost = \'localhost\'; // IP of the host where the firebase function emulator is running.\n' +
		'	public static functionsPort = 5001; // Port used by the firebase function emulator.\n' +
		'	public static token = \'\'; // Telegram Bot Token.\n' +
		'	public static postFunction = \'/your-app/region/your-function-name\'; // The full path to the Function to which all bot messages will be forwarded.\n' +
		'	public static webHook = \'\' // Set it to the real server function and run \'npm set-web-hook\' to set Web Hook to the Bot;\n' +
		'}';
	fs.writeFileSync('src/config.local.ts', configFile);
	console.log('src/config.local.ts has been created, please update it according to your settings.');
	console.log('ATTENTION: DO NOT COMMIT THIS FILE INTO THE VERSION CONTROL SYSTEM!');
	console.log('config.local.ts contains sensitive information and should not be commited anywhere.');
	process.exit(1);
} else {
	const configFile = fs.readFileSync('src/config.local.ts', { encoding: 'utf8', flag: 'r' });
	if (/token = ''/gm.test(configFile) || /postFunction = '\/your-app\/region\/your-function-name'/gm.test(configFile)) {
		console.error('ERROR: Please configure the src/config.local.ts, "token" and "postFunction" are mandatory.');
		process.exit(1);
	}
}

(async () => {
	await esbuild.build({
		entryPoints: ['src/main.ts'],
		bundle: true,
		platform: "node",
		outfile: 'dist/main.js'
	})
})();
