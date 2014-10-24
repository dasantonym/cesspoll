# Cesspoll #


## About ##

Retrieve and save reader comments from major german news sources.

Uses jsdom to extract posts from the website's homepages and then stores the news article and the comments to the article.

The resulting mongodb entries can then be further indexed and analysed.


## Sources ##

Current news sources are:

* [Spiegel Online](http://www.spiegel.de/)


## Install ##

You need nodejs, redis and mongodb.

Checkout, copy ``config.default.js`` to ``config.js`` and run

```
npm install
node app.js
```

from the repository root.
