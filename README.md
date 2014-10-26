# Cesspoll #


## About ##

Retrieve and save reader comments from major german news sources.

Uses jsdom to extract posts from the website's homepages and then stores the news article and the comments to the article.

The resulting mongodb entries can then be further indexed and analysed.


## Sources ##

Current news sources are:

* [Spiegel Online](http://www.spiegel.de/)
* [taz](http://www.taz.de/)


## Install ##

You need nodejs, redis and mongodb.

Checkout, copy ``config.default.js`` to ``config.js`` and run

```
npm install
bower install
node app.js
```

from the repository root.

## Analysis ##

As an optional basic form of analysis the comments are broken up into basic fragments, whitespace is removed and then the example from the [Hyphen](http://sourceforge.net/projects/hunspell/files/Hyphen/) library together with a [hyphenation dictionary](https://www.openoffice.org/lingucomponent/download_dictionary.html) is used to extract syllables (see config file). The analysis results are then stored in the mondodb and are constantly analysed while updating the index.


## Notes from the author ##

This is a quick and dirty crawler for a future art installation of mine so it is not meant to be a fully optimized super-fancy news crawler or something.

It currently crawls over already crawled pages again and does only pull new articles from the front page as well as comments for already pulled articles.

I tried not to be a too huge pig in terms of dirty architecture but there might still be loads of dodgy stuff going on with this app in "production"...
