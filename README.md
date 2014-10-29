# Cesspoll #


## About ##

Node Module to retrieve and save reader comments from major german news sources.

Uses jsdom to extract posts from the website's homepages and then stores the news article and the comments to the article.

The resulting mongodb entries can then be further indexed and analysed.


## Sources ##

Current news sources are:

* [Spiegel Online](http://www.spiegel.de/)
* [taz](http://www.taz.de/)


## Install ##

You need nodejs, redis and mongodb.

Install with

```
npm install https://github.com/dasantonym/cesspoll.git
```

To run it go to ``example/``, copy ``config.default.js`` to ``config.js`` and run

```
node app.js
```


## Analysis ##

As an optional basic form of analysis the comments are broken up into basic fragments, whitespace is removed and then the example from the [Hyphen](http://sourceforge.net/projects/hunspell/files/Hyphen/) library together with a [hyphenation dictionary](https://www.openoffice.org/lingucomponent/download_dictionary.html) is used to extract syllables (see config file). The analysis results are then stored in the mongodb and are constantly analysed while updating the index.


## Notes from the author ##

This is a quick and dirty crawler for a specific art installation so it is not meant to be a fully optimized super-fancy news crawler or something.

It is not very performant, currently redownloads already crawled pages again and does only pull new articles from the front page as well as comments for already pulled articles.
