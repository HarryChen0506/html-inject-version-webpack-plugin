html-inject-version-webpack-plugin
========

### Usage ###

Given a **webpack 4** project, install it as a local development dependency:

```bash
npm install html-inject-version-webpack-plugin --save-dev
```

Then, simply configure it as a plugin in the webpack config:

```javascript
var HtmlInjectVersionWebpackPlugin = require("html-inject-version-webpack-plugin");
module.exports = {
    plugins: [
        new HtmlInjectVersionWebpackPlugin()
    ],
};
```

It will outputs `commitInfo` and `version` such as:

```html
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
</head>

<body>...</body>

</html>
<script>
    window.__VERSION__ = `1.0.0`;
    console.log('%c%s', 'color: white; background: green', `[*] version: v1.0.0`);
</script>
<!--
    "version": "*",
    "commitId": "*",
    "commitName": "*",
    "commitDate": "*",
    "message": "*",
    "buildDate": "*"
-->
```

### Configuration ###

```javascript
new HtmlInjectVersionWebpackPlugin({
    target: Array, // target file, default `['index.html']`
    commit: Boolean, // whether surport inject commit info into html, default `true`
    version: Boolean, // whether surport inject commit version into html, default `true`
})
```
