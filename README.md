# twitter-export-image-fill

(shamelessly ripped off from [Marcin Wichary's](aresluna.org) [Python project of the same name](https://github.com/mwichary/twitter-export-image-fill))

Twitter allows you to download your tweet archive, but that archive doesn’t contain your images. Ergo, it is not really an archive.

This script:
- downloads all the images from your tweets locally
- rewrites the archive files so that they point to the local images

### Instructions

1. Request your Twitter archive from the bottom of https://twitter.com/settings/account.
2. Wait for the email.
3. Download the archive from the email.
4. Unpack it somewhere.
5. Go to the root directory of that archive and run `twitter-export-image-fill.js` there (using terminal/command line).

Note: You can interrupt the script at any time and run it again – it should start where it left off.

### Details

- The script downloads the images in highest quality.
- The original versions of modified JavaScript files are saved for reference.

### FAQ

**Does this work on Windows?**

Developed on Windows, so sure.

**How about MacOS or Linux?**

It's intended to run on Node.js, so sure.

**Does this download videos in addition to images?**

Not sure. Probably not. Let me know if you know!


### License

This script is in public domain. Run free.


### Version history

**1.00 (27 Dec 2016)**
- Initial release