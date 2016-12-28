#!/usr/bin/node
"use strict";

/*
	Twitter export image fill
	by Zack Schuster (completelyfictional.com)
	based on the Python library of the same name by Marcin Wichary (aresluna.org)
	This is free and unencumbered software released into the public domain.
	Anyone is free to copy, modify, publish, use, compile, sell, or
	distribute this software, either in source code form or as a compiled
	binary, for any purpose, commercial or non-commercial, and by any
	means.
	For more information, please refer to <http://unlicense.org/>
*/

const fs = require('fs');
const { get } = require('https');

// Introduce yourself
console.log(green('> Twitter Export Image Fill'));
console.log(green('> By Zack Schuster (completelyfictional.com)'));
console.log(green('> Based on the Python library of the same name by Marcin Wichary (aresluna.org)'));
console.log(green('> For license information, please refer to <http://unlicense.org/>\n'));

let file = '';
let tweet_index = {};
let image_count_global = 0;

const tweet_count_global = JSON.parse(fs.readFileSync('data/js/payload_details.js', 'utf8').replace(/^var payload_details =/, '')).tweets;

// Nicer support for Ctrl-C
process.on('SIGINT', function() {
	console.log('Interrupted! Come back any time.');
	process.exit();
});

process.on('exit', _ => {
	const u = process.uptime();
	const ic = yellow(image_count_global + ' image' + (image_count_global !== 1 ? 's' : ''));
	const uc = magenta(u >= 60 ? (u / 12).toFixed(1) + ' minutes' : u.toFixed(1) + ' seconds');
	console.log(`Downloaded ${ic} after ${uc}`);
})

try {
	// Process the tweet index file to see what needs to be done
	file = fs.readFileSync('data/js/tweet_index.js', 'utf8');
	tweet_index = JSON.parse(file.replace('var tweet_index = ', ''));
} catch(err) {
	const error_msg = [
		'Could not open the data file!',
		'Please run this script from your tweet archive directory',
		'(the one with index.html file).',
		'',
	].join('\n');

	console.error(error_msg);
  process.exit(1);
}

const l = tweet_index.length;
const tc = yellow(tweet_count_global + ' tweet' + (tweet_count_global !== 1 ? 's' : ''));
console.log(`Processing ${tc} from more than ${magenta(pluralize(l, l > 11 ? 'year' : 'month'))} ${magenta('(' + pluralize(l, 'month', false) + ')')} of records`);
console.log('This could take awhile. If you need to cancel out of the script, or if it fails, it will pick back up where it left off when you run it again.\n');

// Loop 1: Go through all the months
// ---------------------------------
tweet_index.forEach((date, i) => {
	const { file_name, year } = date;

	let month = String(date.month);
	if (month.length === 1)
		month = '0' + month;

	// Loop 2: Go through all the tweets in a month
	// --------------------------------------------
	fs.readFile(file_name, 'utf8', (err, data) => {
		if (err) throw err;

		// Make a copy of the original JS file, just in case (only if it doesn't exist before)
		const backup_filename = file_name.replace(/[.]js$/, '_original.js');
		if (!fs.existsSync(backup_filename))
			fs.createWriteStream(backup_filename).write(data);

		// Remove the assignment to a variable that breaks JSON parsing,
		// but save for later since we have to recreate the file
		const first_line_regex = /^Grailbird[.]data[.]tweets_(\w*) =/;
		const first_data_line = data.match(first_line_regex)[0];
		const tweets = JSON.parse(data.replace(first_line_regex, '').replace(/\\u/g, '\\u'));

		const directory_name = `data/js/tweets/${year}_${month}_media`;

		tweets
			.filter(x => !x.retweeted_status && x.entities.media.length > 0) // Don't save images from retweets
			.forEach(tweet => {
				let tweet_image_count = 1;

				// Rewrite tweet date to be used in the filename prefix
				// (only first 19 characters + replace colons with dots)
				const tweet_date = tweet.created_at.replace(/:/g, '.').substring(0, 19);
				const tweet_date_string = new Date(tweet.created_at).toDateString();

				// Loop 3: Go through all the media in a tweet
				// -------------------------------------------
				tweet.entities.media.forEach((media, j) => {
					// media_url_orig being present means we already processed/downloaded this file
					if (Object.keys(media).includes('media_url_orig'))
						return;

					const url = media.media_url_https;
					const extension = url.match(/(.*)\.([^.]*)$/)[2];

					// Only make the directory when we're ready to write the first file;
					// this will avoid empty directories
					if (!fs.existsSync(directory_name))
							fs.mkdirSync(directory_name);

					// Download the original/best image size, rather than the default one
					const better_url = `${url}:orig`;
					const media_file = `data/js/tweets/${year}_${month}_media/${tweet_date}-${tweet.id}-${tweet_image_count}.${extension}`;
					// console.log(`[${year}/${month}] Downloading ${url}...`);

					// Download the file!
					attempt_download(better_url, media_file, function() {
						console.log(`${red(image_count_global)} ${green(tweet_date_string)} Saved ${yellow(url)} to ${blue(media_file)}`);

						// Rewrite the original JSON file so that the archive's index.html
						// will now point to local files... and also so that the script can
						// continue from last point
						media.media_url_orig = media.media_url
						media.media_url = media_file;

						fs.unlinkSync(file_name);
						fs.writeFileSync(file_name, first_data_line + JSON.stringify(tweets));

						tweet_image_count++;
						image_count_global++;
					});
				});
		});
	});
});

function attempt_download(url, destination, cb, tries = 3) {
	get(url, res => {
		const writer = fs.createWriteStream(destination);
		res.on('data', chunk => writer.write(chunk));
		res.on('end', _ => {
			writer.end();
			cb();
		});
	}).on('error', e => {
		console.error(`Error downloading ${yellow(url)}: ${red(e.message.split('\n')[0])} (tries left: ${tries})`);

		tries--;
		if (tries === 0) {
			console.log(`\nFailed to download ${url}.`);
			console.log(`Shutting off for now. Please try again later?`);

			process.exit(1);
		}

		attempt_download(url, destination, cb, tries);
	});
}

function pluralize(num, suffix, divide_num = true) {
	const t = divide_num && num > 11 ? (num / 12).toFixed(1) : num;
	return t + ' ' + suffix + (t > 1 ? 's' : '');
}


function red(str) {
	return wrap(str, 91);
}
function green(str) {
	return wrap(str, 32);
}
function blue(str) {
	return wrap(str, 94);
}
function magenta(str) {
	return wrap(str, 95);
}
function yellow(str) {
	return wrap(str, 93);
}
function wrap(str, color) {
	const open = '\u001b[';
	const close = '\u001b[39m';
	return `${open}${color}m${str}${close}`;
}
